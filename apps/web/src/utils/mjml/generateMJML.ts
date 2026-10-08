// MJML Generation Utility
// This file is separated to avoid Vite's Vue compiler parsing MJML template literals as JSX

export interface Block {
  id: string;
  type: "text" | "image" | "button" | "divider" | "spacer";
  content: Record<string, any>;
}

export const BLOCK_TYPES = {
  text: {
    name: "Texto",
    icon: "type",
    defaultContent: {
      text: "Escribe tu texto aquí...",
      fontSize: 16,
      color: "#1c1917",
      align: "left",
    },
  },
  image: {
    name: "Imagen",
    icon: "image",
    defaultContent: { src: "", alt: "", width: "100%", href: "" },
  },
  button: {
    name: "Botón",
    icon: "mouse-pointer",
    defaultContent: {
      text: "Botón",
      href: "#",
      backgroundColor: "#2563eb",
      color: "#ffffff",
      borderRadius: 4,
      padding: "12px 24px",
    },
  },
  divider: {
    name: "Divisor",
    icon: "minus",
    defaultContent: { color: "#e8e3d9", width: "100%", height: 1 },
  },
  spacer: {
    name: "Espaciador",
    icon: "layout",
    defaultContent: { height: 20 },
  },
};

export function generateMJML(blocks: Block[]): string {
  let mjml = '<mjml><mj-body background-color="#faf9f7">';

  blocks.forEach((block) => {
    switch (block.type) {
      case "text":
        mjml += `
          <mj-section>
            <mj-column>
              <mj-text 
                font-size="${block.content.fontSize}px"
                color="${block.content.color}"
                align="${block.content.align}"
                font-family="Plus Jakarta Sans, Arial, sans-serif"
              >
                ${block.content.text}
              </mj-text>
            </mj-column>
          </mj-section>
        `;
        break;
      case "image":
        mjml += `
          <mj-section>
            <mj-column>
              <mj-image 
                src="${block.content.src}"
                alt="${block.content.alt}"
                width="${block.content.width}"
                ${block.content.href ? `href="${block.content.href}"` : ""}
              />
            </mj-column>
          </mj-section>
        `;
        break;
      case "button":
        mjml += `
          <mj-section>
            <mj-column>
              <mj-button
                href="${block.content.href}"
                background-color="${block.content.backgroundColor}"
                color="${block.content.color}"
                border-radius="${block.content.borderRadius}px"
                padding="${block.content.padding}"
                font-family="Plus Jakarta Sans, Arial, sans-serif"
              >
                ${block.content.text}
              </mj-button>
            </mj-column>
          </mj-section>
        `;
        break;
      case "divider":
        mjml += `
          <mj-section>
            <mj-column>
              <mj-divider
                border-color="${block.content.color}"
                border-width="${block.content.height}px"
                width="${block.content.width}"
              />
            </mj-column>
          </mj-section>
        `;
        break;
      case "spacer":
        mjml += `
          <mj-section>
            <mj-column>
              <mj-spacer height="${block.content.height}px" />
            </mj-column>
          </mj-section>
        `;
        break;
    }
  });

  mjml += "</mj-body></mjml>";
  return mjml;
}
