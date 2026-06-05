Evaluating a number that arrives as text, say `3 + 4 * 2` from a form field, a configuration file or an API, sounds like one line of Python: `eval("3 + 4 * 2")`. That very line is the problem. With **Math Engine** I built a complete evaluation engine from scratch that computes mathematical expressions safely, exactly and traceably, entirely without Python's `eval()`. Since this week it is live on PyPI as version 0.6.7.

## Why not just eval()

`eval()` executes arbitrary Python code. An input disguised as a number, like `__import__('os').system(...)`, runs without complaint. For any application that takes expressions from a file, a form or an API, `eval()` is therefore not a calculator but an open path to code execution.

On top of that come two quieter defects. First, correctness: Python's `float` computes in binary, `0.1 + 0.2` yields `0.30000000000000004`. For a financial formula or an educational context, that is not almost right, it is wrong. Second, diagnostics: a broken expression returns a Python traceback at an internal line number, not the spot in the input string where the problem actually sits.

The task, then, was an engine that never executes foreign code, computes exactly rather than approximately and pinpoints every error to the exact character. And all of that at library quality: tested, documented, versioned and installable via `pip`.

## Safe because it cannot be otherwise

The engine never calls `eval()`, `exec()` or `compile()` anywhere. This is not an after-the-fact filter but the architecture itself. Every input passes through a closed pipeline:

```
Input → Tokenizer → Parser → Evaluator → Formatter → Output
```

The alphabet of this pipeline is finite: numbers, operators, parentheses and a fixed list of permitted function names. At worst, a hostile input can trigger a typed error, never execute code. That is the security guarantee an `eval()`-based solution can in principle never give.

## How the parser understands precedence

Multiplication before addition, parentheses first: operator precedence in Math Engine is not hacked in via a table, but encoded as structure. A recursive-descent parser stacks ten precedence levels into one another, from assignment through bitwise operators and addition up to exponentiation. Whether an operator is left- or right-associative follows from this structure by itself: `a - b - c` is read as `(a - b) - c`, whereas `2 ** 3 ** 2` binds to the right, exactly as in Python.

A deliberate decision here: `^` is bitwise XOR, not exponentiation. Exponentiation is done with `**`, exactly as in C and Python, so that the engine behaves the way a programmer expects.

## Exact instead of almost right

Every number is a `decimal.Decimal` from the first stage to the last, never a `float`. That is why `0.1 + 0.2` is exactly `0.3` here. The computational precision is determined anew for each calculation, between 100 and 10,000 digits depending on the input, with a hard ceiling of 20,000 digits. This way a long result is never silently truncated, and a short one occupies no unnecessary memory.

## Errors that point at the character

Alongside the tokens, the tokenizer keeps a span for each one: start column, end column, original text. This position travels through the entire syntax tree and, at the end, hangs on every error. The result is a diagnostic that does not report "syntax error somewhere", but points at the guilty character.

The same position data serves two modes, switchable via a single setting. For the library, a typed error propagates to the caller, with code and position for catching. For the console, the engine catches itself and draws a pointer exactly under the faulty spot:

```
12 + * 3
     ^
a value was expected here, not an operator
```

Beneath it lies a catalogued system of 78 four-digit error codes across nine families. The digits are structured: code `3008` means "Calculator, core parser, more than one dot in a number". These codes are deliberately never renumbered, they are a contract toward the interface and toward external log parsers.

## More than a calculator

Two further capabilities sit on the same syntax tree. If an expression contains an `=` and a variable, the engine solves the linear equation symbolically instead of guessing, including cleanly named special cases for "no solution" and "infinitely many solutions". And for hardware-near arithmetic there is a programmer's-calculator mode with fixed word width from 8 to 64 bit, two's complement and bitwise operators, so that `127 + 1` in 8-bit mode correctly overflows to `-128`.

## Tested, versioned, shipped

A safe engine you cannot trust is useless. Behind the roughly 4,200 lines of production code there is therefore a suite of 399 pytest tests at 90% coverage. A dedicated helper checks not only that an expression fails, but that it fails with the exact error code at the exact character position. GitHub Actions runs the full suite on every push against five Python versions, from 3.8 to 3.12.

The whole thing ships as a pure-Python wheel with only two dependencies and three console commands, including an interactive REPL with history and tab completion. Six releases in roughly five months, throughout following Semantic Versioning.

## Try it yourself

Math Engine is open source under the MIT license and installed in one line:

```
pip install math-engine
```

The code lives on [GitHub](https://github.com/JanTeske06/math_engine), the package on [PyPI](https://pypi.org/project/math-engine/). The same engineering discipline that carries a published library here also goes into client projects: safe, eval()-free processing of expressions for DSLs, formula editors and rule engines.
