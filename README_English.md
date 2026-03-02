# Windomate

<div align="center">


</div>

<p align="center">
  <a href="./README_English.md">English</a> | <a href="./README.md">中文</a>
</p>


#### The goal of Windomate is to create your own personal AI character, crafting an AI companion that approaches real human behavior - through your data and notes, shaping the ideal image of TA in your mind.

#### This project is inspired by neuro sama. The project can train voice, personality, and replace appearances. Your imagination is as rich as the model can be close to your expectations.

#### If you want to use fully local inference, using local Large Language Models (LLM) for inference or fine-tuning, not based on third-party APIs, you can enter the LLM-studio folder, which contains guidance for local model inference and fine-tuning.

### If you want to use closed-source AI models, we recommend using [DMXAPI](https://www.dmxapi.cn)
### Supports unified calls to most mainstream AI models on the market.

## Roadmap

### Model Support
- [x] Open-source models: Support open-source model fine-tuning and local deployment
- [x] Closed-source models: Support closed-source model integration

### Core Features
- [x] Ultra-low latency: Full local inference, conversation latency under 1 second
- [x] Synchronized subtitle and voice output
- [x] Voice customization: Support for male/female voices, various character voice switching, etc.
- [x] MCP support: Can use MCP tools for integration
- [x] Real-time interruption: Support voice and keyboard interruption of AI speech
- [ ] Realistic emotions: Simulate real human emotional state changes, with its own emotional state
- [ ] Super realistic human-machine experience (similar to real human interaction design, stay tuned)
- [x] Actions and expressions: Display different expressions and actions based on conversation content
- [x] Integrated visual capabilities: Support image recognition and determine when to activate visual functions through language intent
- [x] Voice model (TTS) training support, using gpt-sovits open-source project by default
- [x] Subtitle display in Chinese, audio playback in foreign language. Can be freely enabled/disabled (suitable for character roles where TTS model itself is in a foreign language)

### Extended Features
- [x] Desktop control: Support voice control to open software and other operations
- [x] AI singing
- [ ] Integration with international streaming platforms
- [x] Live streaming function: Can stream on Bilibili platform
- [x] AI teaching: Choose a topic and have AI teach you. You can ask questions midway. For specialized courses, materials can be inserted into the database for AI understanding
- [x] Replace various live 2d models
- [ ] Web page interface support (already completed, will be integrated soon)
- [x] Text conversation: Can type and communicate with AI via keyboard
- [x] Active conversation: Actively initiates conversation based on context. Current version V1
- [x] Internet access: Real-time search for latest information
- [x] Mobile app: Can chat on Android phones
- [x] Play sound effects from sound library, with model deciding which sound effects to play
- [x] Game companionship: Model and user play cooperative, party, puzzle games together. Current experimental games include: Draw & Guess, Monopoly, Galgame, Minecraft, etc. (Currently integrated: Minecraft, Galgame)
- [x] Long-term memory: Let the model remember your key information, your personality, and temperament

### Features the Model Wants (Under Consideration)
- [ ] Screen color change: Change screen color to disturb user based on model's mood
- [ ] Free movement: Model freely moves around the screen

## Open-source projects integrated into this project:

TTS:
https://github.com/RVC-Boss/GPT-SoVITS

AI playing Minecraft:
https://github.com/mindcraft-bots/mindcraft
