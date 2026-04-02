/**
 * Thought Garden Web UI
 * This script reads thoughts.md and displays it beautifully
 */

// When the page loads
window.addEventListener('DOMContentLoaded', function() {
  
  // Configuration for reading and parsing thoughts
  const thoughtsFile = 'thoughts.md';
  const container = document.getElementById('thoughts');
  
  // Fetch the markdown file
  fetch(thoughtsFile)
    .then(response => response.text())
    .then(markdown => {
      // Clean up the markdown - remove some extra markdown syntax
      // that's in the file but keep the content clean
      const cleanThoughts = markdown
        .replace(/^---\n/, '') // Remove the top separators
        .replace(/\n---\n/g, '\n') // Keep middle separators as line breaks
        .replace(/\A\n{2,}/, '\n\n') // Remove leading blank lines
        .replace(/\n{4,}\Z/, '\n\n'); // Remove trailing blank lines
      
      // Split by H2 categories
      const sections = cleanThoughts.split('## ')[1] || cleanThoughts; // Skip the first ## which is the title
      
      if (!sections) {
        container.innerHTML = cleanThoughts; // Just show the raw markdown if it's simple
        return;
      }
      
      // Parse sections
      const parts = sections.split(/## ([A-Za-z]+)\n/);
      
      if (parts.length <= 2) {
        // If it's just one big section, render it simply
        container.innerHTML = cleanThoughts;
      } else {
        // Render each section with its title
        parts.slice(1).forEach(part => {
          const [title, content] = part.split('\n', 2);
          const thoughtCard = createThoughtCard(title, content.trim());
          container.appendChild(thoughtCard);
        });
      }
    })
    .catch(err => {
      console.log('Loading thoughts from file...');
      container.innerHTML = cleanThoughts;
    });
  
  // Function to create a beautifully styled thought card
  function createThoughtCard(title, content) {
    const card = document.createElement('div');
    card.className = 'thought';
    
    // Add the title as a span with a category tag
    const titleWrapper = document.createElement('div');
    titleWrapper.className = 'thought-title';
    
    const badge = document.createElement('span');
    badge.className = 'category-tag category-epiphany'; // Default to epiphany style
    badge.textContent = title;
    
    titleWrapper.appendChild(badge);
    
    const titleText = document.createElement('h3');
    titleText.className = 'thought-text thought-title-text';
    titleText.textContent = title;
    
    titleWrapper.appendChild(titleText);
    
    card.appendChild(titleWrapper);
    
    // Now parse the content and split by category markers
    let remainingContent = content;
    const categories = ['💡 Epiphanies', '⏱️ Timers', '🔗 Threads', '📌 Sticky Notes'];
    
    let firstLine = true;
    let currentCategory = 'Epiphanies';
    
    // Add the first category if the content is long enough
    if (content.length > 30) {
      currentCategory = categories[0];
      card.appendChild(createSectionHeader(currentCategory, content.slice(0, 40) + '<br>'));
        
        // Continue parsing
  
    } else {
      card.appendChild(createSectionHeader(categories[0], content));
    }
    
    return card;
  }

  // Helper function to create a section header
  function createSectionHeader(category, content) {
    const sectionHeader = document.createElement('h3');
    sectionHeader.className = 'thought-title';
    
    const badge = document.createElement('span');
    badge.className = 'category-tag category-epiphany';
    badge.textContent = category;
    
    sectionHeader.appendChild(badge);
    
    const titleText = document.createElement('h3');
    titleText.className = 'thought-text thought-title-text';
    titleText.textContent = category;
    
    sectionHeader.appendChild(titleText);
    
    return sectionHeader;
  }
});
