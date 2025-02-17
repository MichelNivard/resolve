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
      katexNode.setAttribute("contentEditable", "false");
      try {
        katex.render(this.node.textContent, katexNode, {
          displayMode: false,
          throwOnError: false,
        });
      } catch (error) {
        console.warn('KaTeX rendering error:', error);
        katexNode.textContent = this.node.textContent;
      }
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
    this.editor.on("focus", this.handleFocus.bind(this));
    this.editor.on("blur", this.handleBlur.bind(this));

    this.renderer = parent;
    this.content = span;
    this.katexNode = katexNode;
  }

  handleFocus() {
    if (this.selected) {
      this.content.focus();
    }
  }

  handleBlur() {
    if (!this.editor.isDestroyed) {
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

    // Check if selection is inside this node
    if (from >= nodeFrom && to <= nodeTo) {
      if (this.showRendered) {
        this.selectNode();
      }
    } else if (!this.showRendered) {
      this.deselectNode();
    }
  }

  selectNode() {
    if (this.selected) return;
    
    const pos = this.getPos();
    if (pos === undefined) return;

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
      this.katexNode.removeAttribute("style");
      try {
        katex.render(this.node.textContent, this.katexNode, {
          displayMode: false,
          throwOnError: false,
        });
      } catch (error) {
        console.warn('KaTeX rendering error:', error);
        this.katexNode.textContent = this.node.textContent;
      }
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
      try {
        katex.render(this.node.textContent, this.katexNode, {
          displayMode: false,
          throwOnError: false,
        });
      } catch (error) {
        console.warn('KaTeX rendering error:', error);
        this.katexNode.textContent = this.node.textContent;
      }
    }
    return true;
  }

  destroy() {
    this.editor.off("selectionUpdate", this.handleSelectionUpdate.bind(this));
    this.editor.off("focus", this.handleFocus.bind(this));
    this.editor.off("blur", this.handleBlur.bind(this));
  }
}

export default InlineMathNodeView;