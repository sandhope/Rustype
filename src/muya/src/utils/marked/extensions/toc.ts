import type { MarkedExtension } from 'marked';

export interface ITocExtensionOptions {
    tocRenderer?: () => string;
}

export default function tocExtension(options: ITocExtensionOptions = {}): MarkedExtension {
    const { tocRenderer } = options;

    return {
        extensions: [
            {
                name: 'toc',
                level: 'block',
                start(src: string) {
                    return src.match(/^\[toc\]/i)?.index;
                },
                tokenizer(src: string): { type: 'toc'; raw: string } | undefined {
                    const rule = /^\[toc\]\n?/i;
                    const match = rule.exec(src);
                    if (match) {
                        return {
                            type: 'toc',
                            raw: match[0],
                        };
                    }
                    return undefined;
                },
                renderer(): string {
                    if (tocRenderer) {
                        return tocRenderer();
                    }
                    return '';
                },
            },
        ],
    };
}