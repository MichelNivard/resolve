import { Editor } from "@tiptap/core";
import katex from "katex";

class InlineMathNodeView {
  constructor(props) {
    this.editor = props.editor;
    this.node = props.node;
    this.getPos = props.getPos;
    this.showRendered = this.node.textContent.trim() && this.node.attrs.showRendered;
    this.mount();
  }

  mount() {
    const parent = document.createElement("span");
    const katexNode = document.createElement("span");
    const span = document.createElement("span");

    span.innerHTML = this.node.textContent;
    span.classList.add("inline-math-content");
    if (!span.innerText.trim()) {
      span.classList.add("inline-math-content-empty");
    }

    parent.append(span);
    parent.classList.add("inline-math");

    if (this.showRendered) {
      katexNode.setAttribute("contentEditable", "false");
      katex.render(this.node.textContent, katexNode, {
        displayMode: false,
        throwOnError: false,
      });
      parent.append(katexNode);
      span.setAttribute(
        "style",
        "opacity: 0; overflow: hidden; position: absolute; width: 0px; height: 0px;"
      );

      parent.addEventListener("click", () => {
        this.selectNode();
      });

      parent.setAttribute("draggable", "true");
    } else {
      katexNode.setAttribute("style", "display:none;");
      parent.classList.add("inline-math-selected");
    }

    this.editor.on("selectionUpdate", this.handleSelectionUpdate.bind(this));

    this.renderer = parent;
    this.content = span;
  }

  get dom() {
    return this.renderer;
  }

  get contentDOM() {
    return this.content;
  }

  handleSelectionUpdate() {
    const pos = this.getPos();
    if (pos == undefined) return;
    const { from, to } = this.editor.state.selection;

    if (from >= pos && to <= pos + this.node.nodeSize) {
      if (this.showRendered) {
        this.selectNode();
      }
    } else if (!this.showRendered) {
      this.deselectNode();
    }
  }

  selectNode() {
    const pos = this.getPos();
    if (pos == undefined) return;
    const nodeAfter = this.editor.state.tr.doc.resolve(pos).nodeAfter;
    if (nodeAfter?.type.name != "inlineMath") return;

    this.showRendered = false;
    this.renderer.classList.add("inline-math-selected");
    const katexNode = this.renderer.querySelector(
      ":not(.inline-math-content)"
    );
    if (katexNode) {
      katexNode.style.display = "none";
    }
    const contentNode = this.content;
    contentNode.removeAttribute("style");
  }

  deselectNode() {
    this.showRendered = true;
    this.renderer.classList.remove("inline-math-selected");
    const katexNode = this.renderer.querySelector(
      ":not(.inline-math-content)"
    );
    if (katexNode) {
      katexNode.removeAttribute("style");
    }
    const contentNode = this.content;
    contentNode.setAttribute(
      "style",
      "opacity: 0; overflow: hidden; position: absolute; width: 0px; height: 0px;"
    );
  }

  update(node) {
    if (node.type.name !== this.node.type.name) return false;
    this.node = node;
    return true;
  }

  destroy() {
    this.editor.off("selectionUpdate", this.handleSelectionUpdate.bind(this));
  }
}

export default InlineMathNodeView;