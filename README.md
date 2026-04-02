# Thoughts Garden

This project lets you capture ideas directly in your browser and save them to a `thoughts.md` file on your machine.

## 1. Install the Dependencies

```bash
# Make sure you have Node.js installed (>= 12.x)
# If you are on Windows, you can get it from https://nodejs.org

# Install the required npm packages
npm install
```

## 2. Run the Development Server

```bash
# Start the server – it will open on http://localhost:3000
npm start
```

A new browser window will open automatically (or you can open it manually). You should see a page with a list of thoughts and a form at the bottom.

## 3. Using the UI

1. **Add a Thought** – Fill in the date and the text, then click **Plant This Thought**. The entry will instantly appear in the list and will be appended to `thoughts.md`.
2. **View Saved Thoughts** – Open `thoughts.md` in any text editor to see all recorded entries.

## 4. What’s Happening Behind the Scenes?

* The browser runs `web-ui/thoughts-app.js`. When you submit the form, it makes a **POST** request to `/thoughts.md`.
* `server.js` receives that request, writes the new line to `thoughts.md`, and responds with status 200.
* The browser then adds the new card to the page.

## 5. Quick FAQ

- **Do I need to keep the server running?** Yes – the file write happens through the server.
- **Where is the data stored?** In the file `thoughts.md` in the project root.
- **Can I run this on a different port?** Edit the `PORT` variable in `server.js` or set the environment variable `PORT`.

Happy brainstorming! If you run into any issues, feel free to open an issue or just drop a note.
