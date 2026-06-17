import type { Muya } from '../../../muya';
import type { ICursor } from '../../../selection/types';
import { isKeyboardEvent } from '../../../utils';
import Format from '../../base/format';
import { ScrollPage } from '../../scrollPage';

class TocContent extends Format {
    static override blockName = 'toc.content';

    static create(muya: Muya, text: string) {
        const content = new TocContent(muya, text);

        return content;
    }

    constructor(muya: Muya, text: string) {
        super(muya, text);
        this.classList = [...this.classList, 'mu-toc-content'];
        this.createDomNode();
    }

    override getAnchor() {
        return this.parent;
    }

    override update(cursor: ICursor, highlights = []) {
        return this.inlineRenderer.patch(this, cursor, highlights);
    }

    /**
     * Create an empty paragraph below.
     * @param {*} event
     */
    override enterHandler(event: Event) {
        const { text, muya } = this;
        const { start, end } = this.getCursor()!;
        if (start.offset === end.offset && start.offset === 0) {
            const newState = {
                name: 'paragraph',
                text: '',
            };
            const emptyParagraph = ScrollPage.loadBlock(newState.name).create(
                muya,
                newState,
            );
            const toc = this.parent;
            toc!.parent!.insertBefore(emptyParagraph, toc);
        }
        else if (isKeyboardEvent(event)) {
            const offset = text.length;
            this.setCursor(offset, offset);
            super.enterHandler(event);
        }
    }

    override backspaceHandler(event: Event) {
        const { start, end } = this.getCursor()!;
        if (start.offset === 0 && end.offset === 0) {
            // Remove the text content and convert it to paragraph
            this.text = '';
            this.convertToParagraph();
        }
        else {
            super.backspaceHandler(event);
        }
    }
}

export default TocContent;