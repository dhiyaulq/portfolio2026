/**
 * The two marks in the "Chat Now" menu (Figma 223:5378 / 223:5380).
 *
 * Inline rather than loaded from /icons. They were two SVG files, and a file
 * isn't fetched until the element referencing it mounts — which is the moment
 * the menu opens, so the first open showed two empty gaps while the round
 * trip finished. Inline they are part of the markup, and there is nothing to
 * wait for.
 *
 * Each carries its own gradient, drop shadows and clip. Ids in SVG are global
 * to the document, so they are prefixed per icon.
 */
type IconProps = { className?: string };

export function WhatsappIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <g clipPath="url(#wa-clip0)">
        <g filter="url(#wa-filter0)">
          <path d="M10.0008 1.66667C14.6033 1.66667 18.3342 5.3975 18.3342 10C18.3342 14.6025 14.6033 18.3333 10.0008 18.3333C8.52813 18.3359 7.08132 17.9461 5.80917 17.2042L1.67083 18.3333L2.7975 14.1933C2.05497 12.9208 1.66492 11.4733 1.6675 10C1.6675 5.3975 5.39833 1.66667 10.0008 1.66667ZM7.16083 6.08333L6.99417 6.09C6.88641 6.09742 6.78112 6.12573 6.68417 6.17333C6.59381 6.22459 6.5113 6.28858 6.43917 6.36333C6.33917 6.4575 6.2825 6.53917 6.22167 6.61833C5.91343 7.01909 5.74748 7.51109 5.75 8.01667C5.75167 8.425 5.85833 8.8225 6.025 9.19417C6.36583 9.94583 6.92667 10.7417 7.66667 11.4792C7.845 11.6567 8.02 11.835 8.20833 12.0008C9.12786 12.8103 10.2236 13.3941 11.4083 13.7058L11.8817 13.7783C12.0358 13.7867 12.19 13.775 12.345 13.7675C12.5877 13.7547 12.8246 13.689 13.0392 13.575C13.1482 13.5186 13.2547 13.4574 13.3583 13.3917C13.3583 13.3917 13.3936 13.3678 13.4625 13.3167C13.575 13.2333 13.6442 13.1742 13.7375 13.0767C13.8075 13.0044 13.8658 12.9206 13.9125 12.825C13.9775 12.6892 14.0425 12.43 14.0692 12.2142C14.0892 12.0492 14.0833 11.9592 14.0808 11.9033C14.0775 11.8142 14.0033 11.7217 13.9225 11.6825L13.4375 11.465C13.4375 11.465 12.7125 11.1492 12.2692 10.9475C12.2228 10.9273 12.1731 10.9157 12.1225 10.9133C12.0655 10.9074 12.0078 10.9137 11.9535 10.932C11.8991 10.9503 11.8494 10.98 11.8075 11.0192C11.8033 11.0175 11.7475 11.065 11.145 11.795C11.1104 11.8415 11.0628 11.8766 11.0082 11.8959C10.9536 11.9152 10.8944 11.9178 10.8383 11.9033C10.784 11.8889 10.7308 11.8705 10.6792 11.8483C10.5758 11.805 10.54 11.7883 10.4692 11.7583C9.99073 11.5499 9.54787 11.2679 9.15667 10.9225C9.05167 10.8308 8.95417 10.7308 8.85417 10.6342C8.52634 10.3202 8.24063 9.96499 8.00417 9.5775L7.955 9.49833C7.92022 9.44483 7.8917 9.38751 7.87 9.3275C7.83833 9.205 7.92083 9.10667 7.92083 9.10667C7.92083 9.10667 8.12333 8.885 8.2175 8.765C8.30917 8.64833 8.38667 8.535 8.43667 8.45417C8.535 8.29583 8.56583 8.13333 8.51417 8.0075C8.28083 7.4375 8.03972 6.87056 7.79083 6.30667C7.74167 6.195 7.59583 6.115 7.46333 6.09917C7.41833 6.09361 7.37333 6.08917 7.32833 6.08583C7.21644 6.07942 7.10424 6.08053 6.9925 6.08917L7.16083 6.08333Z" fill="url(#wa-paint0)"/>
        </g>
      </g>
      <defs>
        <filter id="wa-filter0" x="0.667487" y="1.66667" width="18.6667" height="19.6667" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="1"/>
          <feGaussianBlur stdDeviation="0.5"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_6"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="1"/>
          <feGaussianBlur stdDeviation="0.5"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.03 0"/>
          <feBlend mode="normal" in2="effect1_dropShadow_0_6" result="effect2_dropShadow_0_6"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="2"/>
          <feGaussianBlur stdDeviation="0.5"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.01 0"/>
          <feBlend mode="normal" in2="effect2_dropShadow_0_6" result="effect3_dropShadow_0_6"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect3_dropShadow_0_6" result="shape"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="2"/>
          <feGaussianBlur stdDeviation="2"/>
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.3 0"/>
          <feBlend mode="normal" in2="shape" result="effect4_innerShadow_0_6"/>
        </filter>
        <radialGradient id="wa-paint0" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(10.0008 1.66667) rotate(90) scale(16.6667)">
          <stop stopColor="#4D5257"/>
          <stop offset="1" stopColor="#373B3F"/>
        </radialGradient>
        <clipPath id="wa-clip0">
          <rect width="20" height="20" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );
}

export function TelegramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <g clipPath="url(#tg-clip0)">
        <g filter="url(#tg-filter0)">
          <path d="M10 1.66667C5.4 1.66667 1.66667 5.4 1.66667 10C1.66667 14.6 5.4 18.3333 10 18.3333C14.6 18.3333 18.3333 14.6 18.3333 10C18.3333 5.4 14.6 1.66667 10 1.66667ZM13.8667 7.33333C13.7417 8.65 13.2 11.85 12.925 13.325C12.8083 13.95 12.575 14.1583 12.3583 14.1833C11.875 14.225 11.5083 13.8667 11.0417 13.5583C10.3083 13.075 9.89167 12.775 9.18333 12.3083C8.35833 11.7667 8.89167 11.4667 9.36667 10.9833C9.49167 10.8583 11.625 8.91667 11.6667 8.74167C11.6725 8.71516 11.6717 8.68764 11.6644 8.6615C11.6572 8.63536 11.6436 8.61139 11.625 8.59167C11.575 8.55 11.5083 8.56667 11.45 8.575C11.375 8.59167 10.2083 9.36667 7.93333 10.9C7.6 11.125 7.3 11.2417 7.03333 11.2333C6.73333 11.225 6.16667 11.0667 5.74167 10.925C5.21667 10.7583 4.80833 10.6667 4.84167 10.375C4.85833 10.225 5.06667 10.075 5.45833 9.91667C7.89167 8.85833 9.50833 8.15833 10.3167 7.825C12.6333 6.85833 13.1083 6.69167 13.425 6.69167C13.4917 6.69167 13.65 6.70833 13.75 6.79167C13.8333 6.85833 13.8583 6.95 13.8667 7.01667C13.8583 7.06667 13.875 7.21667 13.8667 7.33333Z" fill="url(#tg-paint0)"/>
        </g>
      </g>
      <defs>
        <filter id="tg-filter0" x="0.666667" y="1.66667" width="18.6667" height="19.6667" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="1"/>
          <feGaussianBlur stdDeviation="0.5"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_4"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="1"/>
          <feGaussianBlur stdDeviation="0.5"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.03 0"/>
          <feBlend mode="normal" in2="effect1_dropShadow_0_4" result="effect2_dropShadow_0_4"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="2"/>
          <feGaussianBlur stdDeviation="0.5"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.01 0"/>
          <feBlend mode="normal" in2="effect2_dropShadow_0_4" result="effect3_dropShadow_0_4"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect3_dropShadow_0_4" result="shape"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="2"/>
          <feGaussianBlur stdDeviation="2"/>
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.3 0"/>
          <feBlend mode="normal" in2="shape" result="effect4_innerShadow_0_4"/>
        </filter>
        <radialGradient id="tg-paint0" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(10 1.66667) rotate(90) scale(16.6667)">
          <stop stopColor="#4D5257"/>
          <stop offset="1" stopColor="#373B3F"/>
        </radialGradient>
        <clipPath id="tg-clip0">
          <rect width="20" height="20" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );
}
