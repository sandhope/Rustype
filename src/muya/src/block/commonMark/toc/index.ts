import type { Muya } from '../../../muya';
import type { ITocState } from '../../../state/types';
import type TocContent from '../../content/tocContent';
import { mixins } from '../../../utils';
import Parent from '../../base/parent';
import LeafQueryBlock from '../../mixins/leafQueryBlock';
import { ScrollPage } from '../../scrollPage';

@mixins(LeafQueryBlock)
class Toc extends Parent {
    static override blockName = 'toc';

    static create(muya: Muya, state: ITocState) {
        const toc = new Toc(muya);

        toc.append(
            ScrollPage.loadBlock('toc.content').create(muya, state.text),
        );

        return toc;
    }

    override get path() {
        const { path: pPath } = this.parent!;
        const offset = this.parent!.offset(this);

        return [...pPath, offset];
    }

    constructor(muya: Muya) {
        super(muya);
        this.tagName = 'p';
        this.classList = ['mu-toc'];
        this.createDomNode();
    }

    override getState(): ITocState {
        return {
            name: 'toc',
            text: (this.children.head as TocContent).text,
        };
    }
}

export default Toc;
