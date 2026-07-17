class CmxBundle extends HTMLElement {
  connectedCallback() {
    // delegação: o conteúdo interno é substituído a cada troca de variante,
    // então listeners presos ao botão se perderiam
    this.addEventListener('click', (event) => {
      const button = event.target.closest('.cmx-bundle__add');
      if (button && this.contains(button)) this.addToCart(button);
    });

    // esta seção fica fora do <product-info>, que só atualiza elementos
    // internos. Sem isto o total continuaria mostrando o primeiro tamanho
    // depois de o cliente trocar de variante.
    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      this.unsubscribe = subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
        const variantId = event?.data?.variant?.id;
        if (variantId) this.refresh(variantId);
      });
    }
  }

  disconnectedCallback() {
    if (this.unsubscribe) this.unsubscribe();
  }

  async refresh(variantId) {
    const sectionId = this.dataset.sectionId;
    if (!sectionId) return;

    try {
      const url = `${window.location.pathname}?variant=${variantId}&section_id=${sectionId}`;
      const response = await fetch(url);
      const text = await response.text();
      const fresh = new DOMParser().parseFromString(text, 'text/html').querySelector('cmx-bundle');
      if (fresh) this.innerHTML = fresh.innerHTML;
    } catch (error) {
      console.error(error);
    }
  }

  get cart() {
    return document.querySelector('cart-notification') || document.querySelector('cart-drawer');
  }

  setLoading(button, loading) {
    button.disabled = loading;
    button.classList.toggle('is-loading', loading);
    const spinner = button.querySelector('.cmx-bundle__spinner');
    if (spinner) spinner.hidden = !loading;
  }

  showError(message) {
    const box = this.querySelector('.cmx-bundle__error');
    if (!box) return;
    box.textContent = message || '';
    box.hidden = !message;
  }

  async addToCart(button) {
    const ids = (button.dataset.variants || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    if (ids.length === 0) return;

    this.showError('');
    this.setLoading(button, true);

    const body = {
      items: ids.map((id) => ({ id: Number(id), quantity: 1 })),
    };

    const cart = this.cart;
    if (cart) {
      body.sections = cart.getSectionsToRender().map((section) => section.id);
      body.sections_url = window.location.pathname;
      cart.setActiveElement(document.activeElement);
    }

    try {
      const response = await fetch(`${routes.cart_add_url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/javascript',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      // /cart/add.js devolve `status` só quando falha
      if (data.status) {
        this.showError(data.description || data.message);
        return;
      }

      if (!cart) {
        window.location = routes.cart_url;
        return;
      }

      cart.renderContents(data);

      if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
        publish(PUB_SUB_EVENTS.cartUpdate, {
          source: 'cmx-bundle',
          cartData: data,
        });
      }
    } catch (error) {
      console.error(error);
      this.showError('Não foi possível adicionar o combo. Tente novamente.');
    } finally {
      this.setLoading(button, false);
    }
  }
}

if (!customElements.get('cmx-bundle')) {
  customElements.define('cmx-bundle', CmxBundle);
}
