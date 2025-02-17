import { Node } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import InlineMathNodeView from "./inlineMathNodeView";

const NODE_CLASS = "inline-math";
const INPUT_REGEX = /\$([^\$]*)\$/gi; // matches for text inside single $

const InlineMath = Node.create({
  name: "inlineMath",
  content: "text*",
  group: "inline",
  inline: true,
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
        ({ commands }) => {
          return commands.toggleNode(this.name, "text", {
            showRendered: false,
          });
        },
    };
  },

  addInputRules() {
    return [
      {
        find: INPUT_REGEX,
        type: this.type,
        handler({ range, match, chain, state }) {
          const start = range.from;
          const end = range.to;
          if (match[1]) {
            const text = state.schema.text(match[1]);
            chain()
              .command(({ tr }) => {
                tr.replaceRangeWith(start, end, this.type.create(null, text));
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