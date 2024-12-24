import { createCitationMenu } from './CitationComponents';

export const citationCommands = {
  openCitationMenu: ({ range, preSelectedCitations, onUpdate }) => ({ editor, view }) => {
    const { state } = view;
    const { from } = range;
    const coords = view.coordsAtPos(from);

    // Create a div for the menu
    const menuContainer = document.createElement('div');
    menuContainer.style.position = 'absolute';
    menuContainer.style.left = `${coords.left}px`;
    menuContainer.style.top = `${coords.top}px`;
    document.body.appendChild(menuContainer);

    // Create and render the citation menu
    const menu = createCitationMenu({
      editor,
      items: editor.storage.bibMention.items || [],
      preSelectedCitations,
      command: ({ citations }) => {
        onUpdate(citations);
        menuContainer.remove();
      },
      onClose: () => {
        menuContainer.remove();
      }
    });

    // Render menu into container
    menu.mount(menuContainer);

    return true;
  }
};
