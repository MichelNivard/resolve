import { Editor } from "@tiptap/core";
import katex from "katex";

class InlineMathNodeView {
  constructor(props) {
    this.editor = props.editor;
    this.node = props.node;
    this.getPos = props.getPos;
    this.selected = false;
    this.showRendered = this.node.textContent.trim() && this.node.attrs.showRendered;
    this.mount();
  }

  mount() {
    const parent = document.createElement("span");
    const katexNode = document.createElement("span");
    const span = document.createElement("span");

    span.innerHTML = this.node.textContent;
    span.classList.add("inline-math-content");
    span.setAttribute("contenteditable", "true");
    
    if (!span.innerText.trim()) {
      span.classList.add("inline-math-content-empty");
    }

    parent.append(span);
    parent.classList.add("inline-math");

    if (this.showRendered) {
      this.renderKatex(katexNode);
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

    // Store references
    this.renderer = parent;
    this.content = span;
    this.katexNode = katexNode;

    // Add input handler for the closing $ sign
    this.content.addEventListener('input', this.handleInput.bind(this));
    this.content.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  renderKatex(node) {
    node.setAttribute("contentEditable", "false");
    try {
      katex.render(this.node.textContent, node, {
        displayMode: false,
        throwOnError: false,
      });
    } catch (error) {
      console.warn('KaTeX rendering error:', error);
      node.textContent = this.node.textContent;
    }
  }

  handleInput(event) {
    const text = this.content.textContent;
    if (text.endsWith('$')) {
      // Remove the closing $ and update content
      this.content.textContent = text.slice(0, -1);
      this.deselectNode();
    }
  }

  handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.deselectNode();
    }
  }

  get dom() {
    return this.renderer;
  }

  get contentDOM() {
    return this.content;
  }

  handleSelectionUpdate() {
    const pos = this.getPos();
    if (pos === undefined) return;
    
    const { from, to } = this.editor.state.selection;
    const nodeFrom = pos;
    const nodeTo = pos + this.node.nodeSize;

    if (from >= nodeFrom && to <= nodeTo) {
      if (this.showRendered) {
        this.selectNode();
      }
    }
  }

  selectNode() {
    if (this.selected) return;
    
    this.selected = true;
    this.showRendered = false;
    this.renderer.classList.add("inline-math-selected");
    
    if (this.katexNode) {
      this.katexNode.style.display = "none";
    }
    
    if (this.content) {
      this.content.removeAttribute("style");
      this.content.focus();
    }

    // Set cursor to end of content
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(this.content);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  deselectNode() {
    if (!this.selected) return;

    this.selected = false;
    this.showRendered = true;
    this.renderer.classList.remove("inline-math-selected");
    
    if (this.katexNode) {
      this.renderKatex(this.katexNode);
      this.katexNode.removeAttribute("style");
    }
    
    if (this.content) {
      this.content.setAttribute(
        "style",
        "opacity: 0; overflow: hidden; position: absolute; width: 0px; height: 0px;"
      );
    }
  }

  update(node) {
    if (node.type.name !== this.node.type.name) return false;
    this.node = node;
    
    if (this.katexNode && this.showRendered) {
      this.renderKatex(this.katexNode);
    }
    return true;
  }

  destroy() {
    this.editor.off("selectionUpdate", this.handleSelectionUpdate.bind(this));
    if (this.content) {
      this.content.removeEventListener('input', this.handleInput.bind(this));
      this.content.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
  }
}

export default InlineMathNodeView;