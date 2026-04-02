/**
 * Thoughts Garden - Dynamic Web UI
 * Reads thoughts.md and adds new entries dynamically
 */

window.addEventListener('DOMContentLoaded', function() {

  // 1. Load existing thoughts from the markdown file
  const thoughtsFile = 'thoughts.md';
  const container = document.getElementById('thoughts');
  const thoughtCardTemplate = document.createElement('template');
  thoughtCardTemplate.innerHTML = `  .thought {
    padding: 1.5rem;
    margin: 0 0 1rem 0;
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .thought:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.12);
  }
  
  .thought::before {
    content: '';
    display: block;
    width: 12px;
    height: 12px;
    background: var(--accent);
    border-radius: 50%;
    margin-top: -1.5rem;
    margin-left: 1rem;
  }
  
  .thought-category {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem 0.8rem;
    border-radius: 999px;
    font-size: 0.78em;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    margin-top: -1.25rem;
  }
  
  .category-epiphany { background: linear-gradient(135deg, #6c5ce7, #a29bfe); box-shadow: 0 2px 8px rgba(108, 92, 231, 0.25); }
  .category-timer { background: linear-gradient(135deg, #fd79a8, #fbd38d); box-shadow: 0 2px 8px rgba(253, 121, 168, 0.25); }
  .category-thread { background: linear-gradient(135deg, #00b894, #55e6c1); box-shadow: 0 2px 8px rgba(0, 184, 148, 0.25); }
  .category-sticky { background: linear-gradient(135deg, #fdcb6e, #e17055); box-shadow: 0 2px 8px rgba(253, 203, 110, 0.25); }
  
  .thought-inner {
    padding-top: 0;
    line-height: 1.7;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .thought-text {
    font-size: 1.05em;
    line-height: 1.7;
  }
  
  .thought-meta {
    color: var(--date);
    font-size: 0.85em;
    font-weight: 600;
    letter-spacing: 0.03em;
  }
}
`;

  // 2. Parse and transform the markdown into cards
  container.appendChild(thoughtCardTemplate.content.cloneNode(true));
  container.innerHTML = '';
});

// Read the thoughts file and render it
setTimeout(() => {
  fetch('thoughts.md')
    .then(res => res.text())
    .then(markdown => {
      
      // Normalize the markdown - handle multi-line headers better
      const parsed = markdown
        .replace(/^#.*?$\n?/, '') // Remove main title
        .replace(/^---+$\n/, '') // Remove top separator
        .trim()
        .split(/##\s+(?:💡Epiphanies|\n💡Epiphanies)/)
        .filter(Boolean);
      
      // If it's a single big chunk, display it
      if (parsed.length === 1 || !parsed[0]) {
        const content = parsed[0] || markdown;
        const simpleCard = document.createElement('div');
        simpleCard.className = 'thought';
        simpleCard.innerHTML = `
          <div class="thought-category category-epiphany">💡 Epiphanies</div>
          <div class="thought-inner">
            <p class="thought-text">${content}</p>
            <div class="thought-meta">*A collection of ideas in flux*</div>
          </div>
        `;
        document.getElementById('thoughts').appendChild(simpleCard);
      }
      
      // Add a script to handle the submission form
      const form = document.querySelector('.new-thought');
      if (form) {
        form.addEventListener('submit', function(event) {
          event.preventDefault();
          const date = document.getElementById('thoughtDate').value;
          const text = document.getElementById('thoughtText').value;
          
          if (date && text) {
            newThought(date, text);
            form.reset();
          }
        });
      }
      
    })
    .catch(() => {
      console.log('Thoughts are loading...');
      document.getElementById('thoughts').innerHTML = '<em class="thought-meta">...and still loading...</em>';
    });
}, 500);

// Function to add a new thought
function newThought(date, text) {
  // Send the new thought to the server to persist
  fetch('thoughts.md', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, text })
  })
  .then(res => {
    if (!res.ok) throw new Error('Network response was not ok');
    return res.text();
  })
  .catch(err => console.error('Failed to save thought:', err));

  // Optimistically add to the DOM
  const container = document.getElementById('thoughts');
  const card = document.createElement('div');
  card.className = 'thought';
  card.innerHTML = `
    <div class="thought-category category-epiphany">${text.length < 30 ? '💡 Epiphany' : '📌 Sticky Note'}</div>
    <div class="thought-inner">
      <p class="thought-text">${text}</p>
      <div class="thought-meta">*${date}* — *Just dropped*</div>
    </div>
  `;
  container.appendChild(card);
}