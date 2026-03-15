

### better-ctrl-f

better-ctrl-f is a tool that improves the CTRL+F experience in your browser.

## Demo

https://github.com/user-attachments/assets/0b6c35f4-d9b6-4ab4-9e24-329c14d0548c

## Features

* **Subtle & Modern UI:** A premium overlay that appears when you fire `Cmd+F` or `Ctrl+F`, replacing the default browser search.
* **Live Highlighting:** Dynamic in-page highlighting of matches using the custom `TreeWalker` algorithm preventing event listener destruction.
* **Match Case (Aa):** Toggle case sensitivity using the `Aa` button or `Alt+I`.
* **Whole Word (\b):** Match exactly bounded words using the `\b` button or `Alt+W`.
* **Regex Mode (.*):** Unleash the power of regular expressions for advanced searching via the `.*` button or `Alt+R`.
* **Auto-Regex (✨):** Provide a list of words, and better-ctrl-f will build an optimized, grouped regular expression out of them using a Trie-based string reduction algorithm (similar to `grex`).
* **Keyboard Navigation:** Press `Enter` and `Shift+Enter` to seamlessly slide to the next and previous occurrences.
* **Match Export:** Found what you're looking for? Click the download button (⭳) to easily export all the matching texts. Choose between exporting *every single occurrence* exactly as they appear in the file, or only exporting *unique matches* to skip duplicates!
