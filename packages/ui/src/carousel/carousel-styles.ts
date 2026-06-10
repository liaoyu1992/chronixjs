export const CHRONIX_CAROUSEL_CSS = `
.cx-ui-carousel {
  position: relative;
  display: block;
  width: 100%;
  overflow: hidden;
  background: var(--cx-ui-carousel-bg, #f3f4f6);
}

.cx-ui-carousel--direction-horizontal {
  min-height: 160px;
}

.cx-ui-carousel--direction-vertical {
  min-height: 240px;
}

.cx-ui-carousel__viewport {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: inherit;
}

.cx-ui-carousel__slide {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.cx-ui-carousel__slide--active {
  opacity: 1;
  pointer-events: auto;
}

.cx-ui-carousel__arrows {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
  padding: 0 12px;
}

.cx-ui-carousel__arrow {
  pointer-events: auto;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.4);
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cx-ui-carousel__arrow:hover {
  background: rgba(0, 0, 0, 0.6);
}

.cx-ui-carousel__dots {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
}

.cx-ui-carousel--direction-vertical .cx-ui-carousel__dots {
  right: 8px;
  bottom: 50%;
  left: auto;
  top: 50%;
  transform: translateY(-50%);
  flex-direction: column;
}

.cx-ui-carousel__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0;
}

.cx-ui-carousel__dot--active {
  background: var(--cx-ui-carousel-dot-active-bg, #2563eb);
}

.cx-ui-carousel__thumbnails {
  display: flex;
  gap: 4px;
  padding: 8px 0;
  overflow-x: auto;
}

.cx-ui-carousel__thumbnail {
  width: 48px;
  height: 32px;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  background: var(--cx-ui-carousel-thumbnail-bg, #e5e7eb);
  color: var(--cx-ui-carousel-thumbnail-color, #374151);
  padding: 0;
  flex-shrink: 0;
}

.cx-ui-carousel__thumbnail--active {
  border-color: var(--cx-ui-carousel-thumbnail-active-border, #2563eb);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'carousel';

let injected = false;

export function ensureChronixCarouselStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_CAROUSEL_CSS;
  document.head.appendChild(style);
  injected = true;
}
