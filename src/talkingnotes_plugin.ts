// Import necessary modules from Obsidian and OpenAI
import { App, Plugin, PluginSettingTab, Setting, Notice, Modal, TextComponent, ButtonComponent, MarkdownView } from "obsidian";
import { OpenAI } from "openai";

// Define the plugin settings interface
interface OpenAIPluginSettings {
  apiKey: string;
}

// Set default settings for the plugin
const DEFAULT_SETTINGS: OpenAIPluginSettings = {
  apiKey: "",
};

// Main plugin class
export default class OpenAIPlugin extends Plugin {
  settings: OpenAIPluginSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();

    // Add a ribbon icon to trigger OpenAI interaction
    this.addRibbonIcon("brain", "OpenAI Chat", async () => {
      const apiKey = this.settings.apiKey;
      if (!apiKey) {
      new Notice("Please set your OpenAI API key in the settings.");
      return;
    }

      const openai = new OpenAI({ apiKey });

      // Example of a text completion request
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are an assistant summarizing text." },
          { role: "user", content: "Summarize this note content: ..." },
        ],
      });

      new Notice(response.choices[0].message?.content || "No response");

    });

    // Add command to summarize the active note
    this.addCommand({
      id: "summarize-note",
      name: "Summarize Note",
      checkCallback: (checking: boolean) => {
        const activeLeaf = this.app.workspace.activeLeaf;
        if (activeLeaf && activeLeaf.view.getViewType() === "markdown") {
          if (!checking) {
            this.summarizeActiveNote();
          }
          return true;
        }
        return false;
      },
    });

    // Add settings tab
    this.addSettingTab(new OpenAISettingTab(this.app, this));
  }

  async summarizeActiveNote() {
    const activeLeaf = this.app.workspace.activeLeaf;
    if (!activeLeaf) return;

    const file = activeLeaf.view instanceof MarkdownView ? activeLeaf.view.file : null;
    if (!file) return; const content = await this.app.vault.read(file);

    const apiKey = this.settings.apiKey;
    if (!apiKey) {
      new Notice("Please set your OpenAI API key in the settings.");
      return;
    }

    const openai = new OpenAI({ apiKey: apiKey });

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an assistant summarizing text." },
        { role: "user", content: `Summarize this note content: ${content}` },
      ],
    });

    new Notice(response.choices[0].message?.content || "No response");
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

// Settings tab class for the plugin
class OpenAISettingTab extends PluginSettingTab {
  plugin: OpenAIPlugin;

  constructor(app: App, plugin: OpenAIPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("OpenAI API Key")
      .setDesc("Enter your OpenAI API Key here. This key will be stored securely and not tracked by git.")
      .addText((text) =>
        text
          .setPlaceholder("Enter your API key")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          })
      );
  }
}

// Chat modal class to interact with OpenAI
class ChatModal extends Modal {
  plugin: OpenAIPlugin;

  constructor(app: App, plugin: OpenAIPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl("h2", { text: "Chat with OpenAI" });

    const input = new TextComponent(contentEl);
    input.inputEl.style.width = "100%";

    const button = new ButtonComponent(contentEl);
    button.setButtonText("Send").onClick(async () => {
      const message = input.getValue();
      const response = await this.chatWithOpenAI(message);
      contentEl.createEl("p", { text: response });
    });
  }

  async chatWithOpenAI(message: string): Promise<string> {
    const apiKey = this.plugin.settings.apiKey;
    if (!apiKey) {
      new Notice("Please set your OpenAI API key in the settings.");
      return "No response";
    }

    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "user", content: message },
      ],
    });

    return response.choices[0].message?.content || "No response";
  }
}