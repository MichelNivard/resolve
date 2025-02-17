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
    // Create clean elements
    const parent = document.createElement("span");
    const content = document.createElement("span");
    const katexWrapper = document.createElement("span");

    // Set up content element
    content.textContent = this.node.textContent; // Use textContent instead of innerHTML
    content.classList.add("inline-math-content");
    content.setAttribute("contenteditable", "true");
    content.style.cssText = "opacity: 0; position: absolute; pointer-events: none;";

    // Set up katex wrapper
    katexWrapper.classList.add("katex-wrapper");
    this.renderKatex(katexWrapper);

    // Set up parent
    parent.classList.add("inline-math");
    parent.setAttribute("draggable", "true");

    // Build DOM in correct order
    parent.appendChild(content);
    parent.appendChild(katexWrapper);

    // Store references
    this.renderer = parent;
    this.content = content;
    this.katexNode = katexWrapper;

    // Add click handler
    const handleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.selectNode();
    };

    parent.addEventListener("click", handleClick);
    
    // Clean up on destroy
    this.cleanup = () => {
      parent.removeEventListener("click", handleClick);
      this.editor.off("selectionUpdate", this.handleSelectionUpdate.bind(this));
    };

    // Add selection handler
    this.editor.on("selectionUpdate", this.handleSelectionUpdate.bind(this));

    console.log('Mount structure:', {
      parentHTML: parent.outerHTML,
      contentText: content.textContent,
      hasKatex: katexWrapper.querySelector('.katex') !== null
    });
  }

  renderKatex(node) {
    try {
      // Clear any existing content
      node.innerHTML = '';
      katex.render(this.node.textContent, node, {
        displayMode: false,
        throwOnError: false,
      });
    } catch (error) {
      console.warn('KaTeX rendering error:', error);
      node.textContent = this.node.textContent;
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
    this.cleanup();
  }
}

export default InlineMathNodeView;