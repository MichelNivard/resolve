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
    this.katexNode = katexNode;
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

    console.log('Selection Update:', {
      from,
      to,
      nodeFrom,
      nodeTo,
      selected: this.selected,
      showRendered: this.showRendered,
      content: this.content?.textContent,
      isInside: from >= nodeFrom && to <= nodeTo
    });
  
    if (from >= nodeFrom && to <= nodeTo) {
      this.selectNode();
    } else if (this.selected) {
      this.deselectNode();
    }
  }

  selectNode() {
    console.log('Select Node:', {
      beforeState: {
        selected: this.selected,
        showRendered: this.showRendered,
        content: this.content?.textContent,
        katexVisible: this.katexNode?.style.display !== 'none',
        contentStyle: this.content?.getAttribute('style')
      }
    });

    this.selected = true;
    this.showRendered = false;
    
    // First hide KaTeX
    if (this.katexNode) {
      this.katexNode.style.cssText = 'display: none !important; opacity: 0 !important;';
    }
    
    // Then show content
    if (this.content) {
      this.content.style.cssText = 'display: inline !important; opacity: 1 !important; position: static !important; pointer-events: auto !important;';
      this.content.focus();
    }
    
    this.renderer.classList.add("inline-math-selected");

    console.log('After Select:', {
      afterState: {
        selected: this.selected,
        showRendered: this.showRendered,
        content: this.content?.textContent,
        katexVisible: this.katexNode?.style.display !== 'none',
        contentStyle: this.content?.getAttribute('style')
      }
    });
  }

  deselectNode() {
    console.log('Deselect Node:', {
      beforeState: {
        selected: this.selected,
        showRendered: this.showRendered,
        content: this.content?.textContent,
        katexVisible: this.katexNode?.style.display !== 'none',
        contentStyle: this.content?.getAttribute('style')
      }
    });

    this.showRendered = true;
    this.selected = false;
    this.renderer.classList.remove("inline-math-selected");
    
    if (this.katexNode) {
      this.katexNode.removeAttribute("style");
    }
    
    if (this.content) {
      this.content.setAttribute(
        "style",
        "opacity: 0; overflow: hidden; position: absolute; width: 0px; height: 0px;"
      );
    }

    console.log('After Deselect:', {
      afterState: {
        selected: this.selected,
        showRendered: this.showRendered,
        content: this.content?.textContent,
        katexVisible: this.katexNode?.style.display !== 'none',
        contentStyle: this.content?.getAttribute('style')
      }
    });
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