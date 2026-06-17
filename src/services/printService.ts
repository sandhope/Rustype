class MarkdownPrint {
    private container: HTMLElement | null = null;

    /**
     * Prepare document export and append a hidden print container to the window.
     * Everything outside of this hidden print container will be hidden with display: none.
     *
     * @param html HTML string
     * @param renderStatic Render for static files like PDF documents
     */
    renderMarkdown(html: string, renderStatic?: boolean): void {
        this.clearup();

        const printContainer = document.createElement('article');
        printContainer.classList.add('print-container');
        this.container = printContainer;
        printContainer.innerHTML = html;

        // Handle image paths during rendering
        if (renderStatic) {
            const images = printContainer.getElementsByTagName('img');
            for (const image of Array.from(images)) {
                const rawSrc = image.getAttribute('src') ?? '';
                
                // If it's a local absolute/relative path, and not an online image
                if (!rawSrc.startsWith('http://') && !rawSrc.startsWith('https://') && !rawSrc.startsWith('data:')) {
                    try {
                        // Convert to an absolute URL that the current Tauri WebView can recognize
                        image.src = new URL(rawSrc, window.location.href).href;
                    } catch {
                        image.src = rawSrc;
                    }
                }
            }
        }

        document.body.appendChild(printContainer);
    }

    /**
     * Remove the print container from the window.
     */
    clearup(): void {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}

export default MarkdownPrint;