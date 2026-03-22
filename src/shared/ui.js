export const createElement = (tag, options = {}) => {
  const element = document.createElement(tag);
  const { className, text, html, attrs = {}, children = [] } = options;
  if (className) element.className = className;
  if (text) element.textContent = text;
  if (html) element.innerHTML = html;
  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      element.setAttribute(key, value);
    }
  });
  children.forEach((child) => child && element.appendChild(child));
  return element;
};

export const appShell = (content) => {
  const wrapper = createElement('div', { className: 'app-shell' });
  wrapper.appendChild(content);
  return wrapper;
};

export const heroLogo = () => createElement('div', {
  className: 'brand-lockup',
  html: `
    <div class="brand-icon">
      <div class="brand-icon__wrench"></div>
    </div>
    <div>
      <p class="eyebrow">Hire • Services • Experts</p>
      <h1>HireX</h1>
      <p class="subtitle">Soft, secure local service connections powered by role-aware architecture.</p>
    </div>
  `,
});

export const softCard = (...children) => createElement('section', { className: 'soft-card', children });

export const gradientButton = ({ text, variant = 'primary', onClick, active = false, type = 'button' }) => {
  const button = createElement('button', {
    className: `soft-button ${variant} ${active ? 'active' : ''}`,
    text,
    attrs: { type },
  });
  if (onClick) button.addEventListener('click', onClick);
  return button;
};

export const textButton = ({ text, onClick, subtle = false }) => {
  const button = createElement('button', {
    className: `text-button ${subtle ? 'subtle' : ''}`,
    text,
    attrs: { type: 'button' },
  });
  button.addEventListener('click', onClick);
  return button;
};

export const formField = ({ label, name, type = 'text', value = '', placeholder = '', required = false }) => {
  const wrapper = createElement('label', { className: 'field' });
  wrapper.appendChild(createElement('span', { className: 'field__label', text: label }));
  const input = createElement(type === 'textarea' ? 'textarea' : 'input', {
    className: 'field__input',
    attrs: { name, type: type === 'textarea' ? undefined : type, placeholder, value, required: required ? 'true' : undefined },
  });
  if (type === 'textarea') input.value = value;
  wrapper.appendChild(input);
  return { wrapper, input };
};

export const sectionTitle = (title, body) => createElement('div', {
  className: 'section-title',
  html: `<h2>${title}</h2><p>${body}</p>`,
});

export const messageBanner = (text, tone = 'info') => createElement('div', {
  className: `message-banner ${tone}`,
  text,
});
