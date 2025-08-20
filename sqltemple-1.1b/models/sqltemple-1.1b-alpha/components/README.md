---
license: apache-2.0
base_model: TinyLlama/TinyLlama-1.1B-Chat-v1.0
tags:
- text-generation
- sql
- code
- sqltemple
- fine-tuned
language:
- en
datasets:
- xlangai/spider
pipeline_tag: text-generation
model_name: SQLTemple-1.1B-Alpha
---

# SQLTemple-1.1B-Alpha

SQLTemple-1.1B-Alpha is a specialized SQL code generation model fine-tuned from TinyLlama-1.1B-Chat-v1.0 using LoRA on the Spider dataset.

## Model Details

- **Base Model**: TinyLlama/TinyLlama-1.1B-Chat-v1.0
- **Parameters**: ~1.1B
- **Training Dataset**: Spider (7,000 examples)
- **Training Method**: LoRA (r=16, α=32)
- **Training Examples**: 1,000
- **Context Length**: 512 tokens

## Usage

```python
from transformers import AutoTokenizer, AutoModelForCausalLM

tokenizer = AutoTokenizer.from_pretrained("./sqltemple-1.1b-alpha-hf")
model = AutoModelForCausalLM.from_pretrained("./sqltemple-1.1b-alpha-hf")

prompt = "<|system|>You are an SQL assistant. Answer in valid SQL.\n<|user|>Question: Get all users\n<|assistant|>"
inputs = tokenizer(prompt, return_tensors="pt")
outputs = model.generate(**inputs, max_new_tokens=100)
```

## Training Details

- Epochs: 1
- Learning Rate: 0.0001
- Batch Size: 8
