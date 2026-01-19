<script lang="ts">
  // Index page - project overview
</script>

<div class="hero container">
  <h1>ts2cs</h1>
  <p class="tagline">TypeScript to C# transpiler for <strong>Godot 4.x</strong></p>

  <p class="description">
    Write your game logic in TypeScript with full IntelliSense support, then transpile to Godot-compatible C# scripts.
  </p>

  <div class="cta-buttons">
    <a href="/repl" class="btn btn-primary">Try the REPL</a>
    <a href="/docs" class="btn btn-secondary">Read the Docs</a>
  </div>
</div>

<section class="features container">
  <h2>Features</h2>

  <ul class="feature-list">
    <li>
      <strong>Godot Integration</strong>
      <span>Automatic detection of Godot base classes with proper <code>using Godot;</code> generation</span>
    </li>
    <li>
      <strong>Type Transpilation</strong>
      <span>Comprehensive TypeScript to C# type mappings with configurable options</span>
    </li>
    <li>
      <strong>Class Support</strong>
      <span>Full class transpilation including properties, methods, constructors, and inheritance</span>
    </li>
    <li>
      <strong>Discriminated Unions</strong>
      <span>TypeScript unions become abstract base classes with subclasses</span>
    </li>
    <li>
      <strong>Async/Await</strong>
      <span><code>Promise&lt;T&gt;</code> maps to <code>Task&lt;T&gt;</code></span>
    </li>
    <li>
      <strong>Accessors</strong>
      <span>TypeScript getters/setters become C# properties</span>
    </li>
  </ul>
</section>

<section class="example container">
  <h2>Example</h2>

  <div class="code-comparison">
    <div class="code-block">
      <h3>TypeScript</h3>
      <pre><code
          >class Player extends Node2D &#123;
  health: number = 100;

  takeDamage(amount: number): void &#123;
    this.health -= amount;
  &#125;

  get isAlive(): boolean &#123;
    return this.health > 0;
  &#125;
&#125;</code
        ></pre>
    </div>

    <div class="code-block">
      <h3>C# Output</h3>
      <pre><code
          >using Godot;

public partial class Player : Node2D
&#123;
    public float health = 100;

    public void TakeDamage(float amount)
    &#123;
        this.health -= amount;
    &#125;

    public bool isAlive
    &#123;
        get => this.health > 0;
    &#125;
&#125;</code
        ></pre>
    </div>
  </div>
</section>

<style>
  .hero {
    text-align: center;
    padding-block: var(--size-10) var(--size-8);
  }

  .hero h1 {
    font-family: var(--font-mono);
    font-size: var(--font-size-8);
    margin-bottom: var(--size-2);
  }

  .tagline {
    font-size: var(--font-size-4);
    color: var(--text-2);
    margin-bottom: var(--size-4);
  }

  .description {
    font-size: var(--font-size-2);
    color: var(--text-3);
    max-width: 600px;
    margin-inline: auto;
    margin-bottom: var(--size-6);
  }

  .cta-buttons {
    display: flex;
    gap: var(--size-4);
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn {
    display: inline-block;
    padding: var(--size-3) var(--size-5);
    border-radius: var(--radius-2);
    font-weight: var(--font-weight-6);
    font-size: var(--font-size-1);
    text-decoration: none;
    transition: background 0.15s ease;
  }

  .btn-primary {
    background: var(--accent);
    color: var(--gray-9);
  }

  .btn-primary:hover {
    background: var(--accent-hover);
    color: var(--gray-9);
    text-decoration: none;
  }

  .btn-secondary {
    background: var(--surface-3);
    color: var(--text-1);
  }

  .btn-secondary:hover {
    background: var(--surface-4);
    text-decoration: none;
  }

  .features,
  .example {
    padding-block: var(--size-8);
  }

  .features h2,
  .example h2 {
    font-size: var(--font-size-5);
    margin-bottom: var(--size-5);
  }

  .feature-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--size-4);
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .feature-list li {
    background: var(--surface-2);
    padding: var(--size-4);
    border-radius: var(--radius-2);
    border: 1px solid var(--border-subtle);
  }

  .feature-list strong {
    display: block;
    margin-bottom: var(--size-2);
    color: var(--text-1);
  }

  .feature-list span {
    color: var(--text-2);
    font-size: var(--font-size-1);
  }

  .code-comparison {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--size-4);
  }

  .code-block {
    background: var(--surface-2);
    border-radius: var(--radius-2);
    border: 1px solid var(--border-subtle);
    overflow: hidden;
  }

  .code-block h3 {
    font-size: var(--font-size-1);
    padding: var(--size-3);
    margin: 0;
    background: var(--surface-3);
    border-bottom: 1px solid var(--border-subtle);
  }

  .code-block pre {
    margin: 0;
    border-radius: 0;
    font-size: var(--font-size-0);
  }

  .code-block code {
    background: none;
    padding: 0;
  }
</style>
