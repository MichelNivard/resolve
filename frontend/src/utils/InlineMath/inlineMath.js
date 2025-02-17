import { Node } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import InlineMathNodeView from "./inlineMathNodeView";

const NODE_CLASS = "inline-math";
const INPUT_REGEX = /\$([^\$]*)\$/gi;

const InlineMath = Node.create({
  name: "inlineMath",
  content: "text*",
  group: "inline",
  inline: true,
  selectable: true,
  atom: true,
  marks: "",
  draggable: true,

  addAttributes() {
    return {
      showRendered: {
        default: true,
        renderHTML() {
          return {};
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: `span.${NODE_CLASS}`, priority: 1000 }];
  },

  renderHTML() {
    return ["span", { class: NODE_CLASS }, 0];
  },

  addNodeView() {
    return (props) => new InlineMathNodeView(props);
  },

  addCommands() {
    return {
      toggleInlineMath:
        () =>
        ({ commands, chain }) => {
          return chain()
            .focus()
            .toggleNode(this.name, "text", {
              showRendered: false,
            })
            .run();
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { empty, $anchor } = editor.state.selection;
        if (!empty || $anchor.parent.type.name !== this.name) {
          return false;
        }
        return editor.commands.command(({ tr, dispatch }) => {
          if (dispatch) {
            const pos = $anchor.after();
            tr.replaceWith(pos - 1, pos, editor.schema.text(" "));
            return true;
          }
          return false;
        });
      },
    };
  },

  addInputRules() {
    return [
      {
        find: INPUT_REGEX,
        type: this.type,
        handler({ range, match, chain }) {
          const start = range.from;
          const end = range.to;
          if (match[1]) {
            chain()
              .focus()
              .command(({ tr }) => {
                const node = this.type.create(null, [
                  { type: "text", text: match[1] }
                ]);
                tr.replaceRangeWith(start, end, node);
                return true;
              })
              .run();
          }
        },
      },
    ];
  },
});

export default InlineMath;