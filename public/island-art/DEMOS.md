# Interactive demos: one per island

One interactive demo per island. status 'live' = working reference in site/demos.js; 'spec' = build it from this description. Every demo runs in the browser with no server, no API key and no model download, unless 'needs' says otherwise.

Live reference implementations: `site/demos.js` (S2 gradient descent, S3 overfitting, U1 temperature).
Build the rest to the same pattern:

- `export function ID(el, { hue })` mounts into `el` and renders the `.demo` shell (header, canvas, side controls).
- Canvas drawn at device pixel ratio up to 2, 720×440 logical, `role="img"` with an aria-label.
- Every control is a real `<button>` / `<input type=range>` with a label. Results go in an `aria-live` region.
- Pause animation loops when off-screen (IntersectionObserver). With reduced motion, jump to the end state instead of animating.
- Use the island's track colour (`hue`) for the main mark and glow; gold for secondary marks; ivory for data points.
- Precomputed data ships as small JSON next to the demo. Never call a paid API from a demo.
- Label simulations honestly ("toy example", "example output").
- Register it in `LIVE` at the bottom of `demos.js`; the island page picks it up automatically.

| id | island | demo | status |
|---|---|---|---|
| S0 | AI literacy | Is it AI, ML or just rules? | spec |
| S1 | Python | Python in your browser | spec |
| S2 | Math for machine learning | Gradient descent, step by step | live |
| S3 | Machine learning basics | Overfitting you can see | live |
| S4 | Deep learning | A tiny neural net learns a spiral | spec |
| U1 | LLM APIs and prompting | Temperature and the next word | live |
| U2 | RAG: answers from your documents | Ask the documents | spec |
| U3 | Agents and tools | Agent loop, visible | spec |
| U4 | Evals and shipping | Be the eval | spec |
| T1 | Open models and Hugging Face | Open model picker | spec |
| T2 | Fine-tuning with LoRA | LoRA: tune a few knobs | spec |
| T3 | Preference tuning: RLHF, DPO and GRPO | Which answer is better? | spec |
| T4 | Evaluate, quantize and serve | Quantization slider | spec |
| B1 | Neural nets from scratch | Backprop by hand | spec |
| B2 | A GPT from scratch | Attention heatmap | spec |
| B3 | Tokenizers, data and pretraining | Build a tokenizer | spec |
| B4 | Scale and research | Scaling-law explorer | spec |
| V1 | Vision foundations | See like a convnet | spec |
| V2 | Detection, segmentation and multimodal | Boxes and masks | spec |
| L1 | Language foundations | Words as points | spec |
| L2 | Modern NLP with transformers | Same sentence, five tasks | spec |
| G1 | Generative models | Walk the latent space | spec |
| G2 | Diffusion and flow matching | Noise to picture | spec |
| R1 | Reinforcement learning foundations | Teach a robot to cross the grid | spec |
| R2 | Deep reinforcement learning | Policy learns to balance | spec |
| M1 | ML systems design | Design the system | spec |
| M2 | MLOps in practice | Drift alarm | spec |
| A1 | AI safety foundations | Risk sorter | spec |
| A2 | Alignment and interpretability | Look inside a neuron | spec |

## S0 · AI literacy: Is it AI, ML or just rules?

- **You do:** Sort 8 everyday systems (spam filter, calculator, chess engine, chatbot, thermostat, photo search…) into Rules / Machine learning / Deep learning / LLM by dragging cards into bins.
- **You learn:** The difference between AI, ML, deep learning and LLMs, and that 'AI' is a spectrum, not magic.
- **How to build it:** Drag-and-drop with keyboard alternative (select card, then press 1-4). Reveal an explanation per card on drop. Score at the end.
- **Status:** spec

## S1 · Python: Python in your browser

- **You do:** Edit and run 4 tiny Python snippets (variables, a loop, a function, a dict) and see the output live. Then fix a broken one by reading its traceback.
- **You learn:** Code is just instructions you can read, run and change; a traceback tells you exactly which line broke.
- **How to build it:** Pyodide from cdn.jsdelivr.net/pyodide (≈10 MB, load on click, show progress). Monaco or a plain textarea with mono font. Pre-written snippets, a Run button, an output panel.
- **Needs:** Pyodide download on demand
- **Status:** spec

## S2 · Math for machine learning: Gradient descent, step by step

- **You do:** Watch a line fit noisy points. Change the learning rate, press Step or Run, drag points around and see the loss curve react.
- **You learn:** A model learns by following the slope of its error downhill; too small a learning rate is slow, too big overshoots and diverges.
- **How to build it:** Canvas: points, current line, loss-over-steps sparkline. Plain JS math, no libraries.
- **Status:** live

## S3 · Machine learning basics: Overfitting you can see

- **You do:** Slide polynomial degree from 1 to 12 and resample the noise. Training error keeps falling; validation error drops then climbs.
- **You learn:** Why you hold out validation data, and what overfitting and underfitting look like.
- **How to build it:** Canvas: train points (filled), validation points (hollow), fitted curve, two error bars. Least squares via normal equations, plain JS.
- **Status:** live

## S4 · Deep learning: A tiny neural net learns a spiral

- **You do:** Pick 1–3 hidden layers and 2–16 neurons, press Train and watch the decision boundary bend to separate two spirals.
- **You learn:** Layers of simple units can learn shapes a straight line never could; more capacity learns faster but can overfit.
- **How to build it:** Small MLP with manual backprop in JS (like TensorFlow Playground), heatmap on canvas, 60 fps training loop paused off-screen.
- **Status:** spec

## U1 · LLM APIs and prompting: Temperature and the next word

- **You do:** Type a prompt start, see a toy model's top next words as probability bars, move the temperature slider and sample 10 times.
- **You learn:** An LLM predicts likely next tokens; temperature reshapes the odds, from predictable to creative to nonsense.
- **How to build it:** Toy distribution table (no real model), softmax with temperature, animated bars, a sample button that streams words.
- **Status:** live

## U2 · RAG: answers from your documents: Ask the documents

- **You do:** Ask a question about a 6-page mini handbook. See which chunks retrieval picks, their similarity scores, and the cited answer.
- **You learn:** RAG = find the right passages first, then answer only from them, with citations.
- **How to build it:** Precomputed embeddings for ~40 chunks (ship as JSON) and for ~20 sample questions; cosine similarity in JS; answers are templated from the top chunk. Label it as a simulation.
- **Status:** spec

## U3 · Agents and tools: Agent loop, visible

- **You do:** Give an agent a task ('find the cheapest flight and add it to my calendar'). Step through Think → Call tool → Read result → Think until done; break a tool to see it recover.
- **You learn:** Agents are a loop of reasoning and tool calls, and most of the engineering is in the tools and error handling.
- **How to build it:** Scripted trace (JSON) with branching on 'tool fails'; timeline UI with expandable tool-call JSON.
- **Status:** spec

## U4 · Evals and shipping: Be the eval

- **You do:** Grade 12 model answers as pass/fail, then compare your grades with an LLM-judge's grades and see where you disagree.
- **You learn:** Evals start from real examples and human judgment; automatic judges must be checked against people.
- **How to build it:** Static dataset of answers + judge labels, agreement % and a confusion matrix.
- **Status:** spec

## T1 · Open models and Hugging Face: Open model picker

- **You do:** Set your laptop's RAM/GPU and a task; see which open-weight model sizes fit, at what quantization, and roughly how fast.
- **You learn:** Parameters × bytes per weight = memory; why 7B runs on a laptop and 70B doesn't.
- **How to build it:** Calculator with sliders; formula shown under the result. Cite the formula, don't invent benchmarks.
- **Status:** spec

## T2 · Fine-tuning with LoRA: LoRA: tune a few knobs

- **You do:** Toggle between full fine-tuning and LoRA on a big weight grid; drag rank r from 1 to 64 and watch trainable parameters and memory change.
- **You learn:** LoRA freezes the big matrix and trains two thin ones, so you update ~1% of the parameters.
- **How to build it:** SVG matrix diagram (W ≈ W + B·A), live parameter counter.
- **Status:** spec

## T3 · Preference tuning: RLHF, DPO and GRPO: Which answer is better?

- **You do:** Pick the better of two answers for 8 prompts. Your choices train a tiny reward model; then see how it ranks new answers.
- **You learn:** Preference tuning learns from comparisons, not from correct labels; reward models copy your taste, including your biases.
- **How to build it:** Bradley–Terry on 3 hand-made features (length, politeness, correctness flag) in JS; show learned weights.
- **Status:** spec

## T4 · Evaluate, quantize and serve: Quantization slider

- **You do:** Drag precision from 16-bit to 2-bit and watch a sample image/weight histogram get coarser, memory drop and a quality score fall.
- **You learn:** Quantization trades a little quality for a lot of memory and speed, and it breaks down at very low bits.
- **How to build it:** Quantize a real image's pixel values as a stand-in for weights; show memory maths for a 7B model alongside.
- **Status:** spec

## B1 · Neural nets from scratch: Backprop by hand

- **You do:** Change inputs and weights in a tiny computation graph (a·b + c, then tanh); press Backward and watch gradients flow node by node.
- **You learn:** Backpropagation is the chain rule, applied from the output back to every input.
- **How to build it:** SVG graph like micrograd's, values and grads on each node, animated edges.
- **Status:** spec

## B2 · A GPT from scratch: Attention heatmap

- **You do:** Hover any word in a sentence to see which earlier words it attends to, across 4 heads.
- **You learn:** Attention lets each token look back at the tokens that matter for it.
- **How to build it:** Precomputed attention weights from a small model for 5 sentences (JSON); heatmap rows highlight on hover.
- **Status:** spec

## B3 · Tokenizers, data and pretraining: Build a tokenizer

- **You do:** Press Merge to run byte-pair encoding on a paragraph one step at a time and watch frequent pairs become new tokens.
- **You learn:** Tokenizers are learned from data; common chunks become single tokens.
- **How to build it:** Real BPE in JS on a short text, a merge table, token count dropping step by step.
- **Status:** spec

## B4 · Scale and research: Scaling-law explorer

- **You do:** Choose model size and training tokens on log sliders; see predicted loss and compute cost, and find the compute-optimal point.
- **You learn:** Bigger models need more data; there's a best size for a given compute budget.
- **How to build it:** Plot the published Chinchilla fit (Hoffmann et al., 2022) with its constants cited; log-log canvas chart.
- **Status:** spec

## V1 · Vision foundations: See like a convnet

- **You do:** Pick a photo and a filter (edges, blur, sharpen, custom 3×3) and watch the convolution slide across it; stack two layers.
- **You learn:** Convolutions detect local patterns; stacked layers build bigger features.
- **How to build it:** Canvas pixel ops in JS on 3 public-domain images from this library.
- **Status:** spec

## V2 · Detection, segmentation and multimodal: Boxes and masks

- **You do:** Toggle detection boxes, segmentation masks and labels on a painting from the atlas; adjust the confidence threshold.
- **You learn:** Detection says what and where; segmentation outlines each pixel; thresholds trade misses for false alarms.
- **How to build it:** Precomputed boxes/masks for 3 paintings (JSON/PNG), opacity animations, threshold slider.
- **Status:** spec

## L1 · Language foundations: Words as points

- **You do:** Explore a 2D map of 300 words; click one to see its nearest neighbours; try king − man + woman.
- **You learn:** Embeddings turn words into numbers where similar meanings sit close together.
- **How to build it:** Precomputed 2D projection + 50-d vectors (GloVe, PDDL licence) for 300 words; cosine search in JS.
- **Status:** spec

## L2 · Modern NLP with transformers: Same sentence, five tasks

- **You do:** Paste a short invoice-like text and switch between tasks: classify, extract fields, summarize, translate, answer a question.
- **You learn:** One pretrained transformer can be fine-tuned for many language tasks.
- **How to build it:** Scripted outputs for 4 sample texts (label 'example output'); optional real model via transformers.js if the user opts in.
- **Needs:** optional transformers.js model download
- **Status:** spec

## G1 · Generative models: Walk the latent space

- **You do:** Drag a point across a 2D latent grid and watch a tiny decoder morph one image into another.
- **You learn:** Generative models learn a smooth space where nearby points decode to similar images.
- **How to build it:** Precomputed grid of 10×10 decoded images (sprite sheet) from a small VAE; interpolate between cells.
- **Status:** spec

## G2 · Diffusion and flow matching: Noise to picture

- **You do:** Scrub a timeline from pure noise to a finished painting and back; change the number of steps.
- **You learn:** Diffusion learns to remove noise a little at a time.
- **How to build it:** Precomputed frames of a denoising run on a public-domain painting (sprite or WebP sequence), scrub slider.
- **Status:** spec

## R1 · Reinforcement learning foundations: Teach a robot to cross the grid

- **You do:** Watch a Q-learning agent explore a 6×6 grid with a goal and pits. Change the reward and exploration rate; see the value map update.
- **You learn:** Agents learn from reward by trial and error; exploration vs exploitation.
- **How to build it:** Tabular Q-learning in JS, arrows per cell, value heatmap, speed control.
- **Status:** spec

## R2 · Deep reinforcement learning: Policy learns to balance

- **You do:** Train a policy-gradient agent on CartPole in the browser and plot the reward curve; compare a random policy.
- **You learn:** Deep RL learns behaviours from reward alone, and training is noisy.
- **How to build it:** CartPole physics in JS + REINFORCE with a tiny network; canvas render.
- **Status:** spec

## M1 · ML systems design: Design the system

- **You do:** Drag blocks (data source, feature store, training, registry, API, monitor) into a pipeline and see what breaks when one is missing.
- **You learn:** A model is a small part of an ML system; the rest is data, deployment and monitoring.
- **How to build it:** Snap-to-slot board with validation messages; keyboard support.
- **Status:** spec

## M2 · MLOps in practice: Drift alarm

- **You do:** Watch live predictions stream on a dashboard; push a 'season change' button and see input drift, accuracy fall and an alert fire.
- **You learn:** Models decay in production; monitoring catches it so you can retrain.
- **How to build it:** Simulated data stream, two sparklines and a threshold alert.
- **Status:** spec

## A1 · AI safety foundations: Risk sorter

- **You do:** Place 10 AI failure scenarios on likelihood × severity axes, then compare with how researchers rate them.
- **You learn:** Different risks need different responses; reasonable people disagree on how likely each is.
- **How to build it:** Drag on a 2D grid; reveal sourced references after placement. Keep it balanced; cite sources.
- **Status:** spec

## A2 · Alignment and interpretability: Look inside a neuron

- **You do:** Click neurons in a toy network trained on simple shapes to see which inputs make them fire most.
- **You learn:** Interpretability looks inside models to find features they actually use.
- **How to build it:** Precomputed activations for a small CNN on 200 tiny shapes; top-activating examples per neuron.
- **Status:** spec
