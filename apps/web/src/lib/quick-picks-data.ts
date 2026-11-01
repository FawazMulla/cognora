/**
 * Pre-mapped Quick Pick Questions and Comprehensive Model Answers
 * Derived from syllabus solution sets (ITC701, ITDO7024, ITDO7014, ITC702)
 */

export interface VivaQuestion {
  question: string;
  answer: string;
}

export interface HardcodedPractical {
  aim: string;
  apparatus: string;
  theory: string;
  diagramAscii: string;
  algorithm: string[];
  code: string;
  expectedInput: string;
  expectedOutput: string;
  observation: string;
  conclusion: string;
  vivaQuestions: VivaQuestion[];
}

export interface QuickPickItem {
  id: string;
  category: 'practical' | 'qa' | 'pyq' | 'smart_module';
  title: string;
  subtitle: string;
  subject: string;
  subjectCode: string;
  marks: number;
  tags: string[];
  keywords: string[];
  answerMarkdown: string;
  practicalData?: HardcodedPractical;
}

export const QUICK_PICK_DATASET: QuickPickItem[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. PRACTICAL GENERATION: McCulloch-Pitts ANN (AI & DS - II)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'qp-practical-mp-neuron',
    category: 'practical',
    title: 'Implement Binary Logic Gates using McCulloch-Pitts ANN',
    subtitle: 'AND, OR, NOR, XOR realization with threshold analysis & Python NumPy implementation',
    subject: 'AI and DS – II',
    subjectCode: 'ITC701',
    marks: 10,
    tags: ['Practical', 'ANN', 'McCulloch-Pitts', 'Neural Networks', 'Python'],
    keywords: [
      'mcculloch pitts',
      'm-p neuron',
      'binary gates',
      'logic gates',
      'and gate',
      'or gate',
      'nor gate',
      'xor gate',
      'linear separability',
      'threshold activation',
    ],
    answerMarkdown: `## 1. AIM
Implement binary logic gates (AND, OR, NOR, XOR) using the McCulloch-Pitts (M-P) Artificial Neuron model.

---

## 2. APPARATUS & ENVIRONMENT
- **Operating System:** Linux / Windows 11
- **Interpreter:** Python 3.10+
- **Libraries:** NumPy, Tabulate
- **Hardware:** Dual Core 2.0GHz CPU, 4GB RAM minimum

---

## 3. THEORETICAL FOUNDATION
The **McCulloch-Pitts (M-P) neuron** (1943) is the foundational mathematical abstraction of biological neurons. It operates as a binary threshold device:
$$\\text{Net Input: } y_{\\text{in}} = \\sum_{i=1}^{n} w_i x_i$$
$$\\text{Activation: } y = \\begin{cases} 1 & \\text{if } y_{\\text{in}} \\ge \\theta \\\\ 0 & \\text{if } y_{\\text{in}} < \\theta \\end{cases}$$

- **Excitatory Inputs:** Carry positive weight ($+1$).
- **Inhibitory Inputs:** Carry negative weight ($-p$ or veto signal).
- **Linear Separability:** A single M-P neuron can only separate linearly separable truth tables (AND, OR, NOT, NOR). It **cannot solve XOR** directly because XOR requires a non-linear decision boundary; hence a two-layer multi-neuron architecture is mandatory ($XOR = (x_1 \\land \\neg x_2) \\lor (\\neg x_1 \\land x_2)$).

---

## 4. ARCHITECTURE DIAGRAM (ASCII)
\`\`\`
   (a) AND Gate:               (b) OR Gate:
   x1 ----(+1)----> [ Y ]      x1 ----(+1)----> [ Y ]
   x2 ----(+1)----> [θ = 2]    x2 ----(+1)----> [θ = 1]

   (c) NOR Gate (Both Inhibitory):
   x1 ----(-1)----> [ Y ]
   x2 ----(-1)----> [θ = 0]

   (d) XOR Multi-Layer Network (Non-linear):
   x1 ----(+1)--------> [ Z1 ] ----(+1)----\\
      \\---(-1)---\\     [θ = 1]             \\
                  \\                         --> [ Y (OR) ]
      /---(+1)---/\\                         /   [ θ = 1  ]
   x2 ----(-1)--------> [ Z2 ] ----(+1)----/
                       [θ = 1]
\`\`\`

---

## 5. ALGORITHM
1. Initialize binary input patterns $X \\in \\{0, 1\\}^2$.
2. For AND gate: set weights $w_1 = 1, w_2 = 1$ and threshold $\\theta = 2$.
3. For OR gate: set weights $w_1 = 1, w_2 = 1$ and threshold $\\theta = 1$.
4. For NOR gate: set inhibitory weights $w_1 = -1, w_2 = -1$ and threshold $\\theta = 0$.
5. For XOR gate:
   - Compute hidden neuron $Z_1 = (x_1 \\land \\neg x_2)$ with $w = (1, -1), \\theta = 1$.
   - Compute hidden neuron $Z_2 = (\\neg x_1 \\land x_2)$ with $w = (-1, 1), \\theta = 1$.
   - Compute output neuron $Y = (Z_1 \\lor Z_2)$ with $w = (1, 1), \\theta = 1$.
6. Tabulate output and verify against truth table invariants.`,
    practicalData: {
      aim: 'Implement binary gates [OR, AND, NOR, XOR] using McCulloch-Pitts ANN.',
      apparatus: 'Python 3.10+, NumPy library, VSCode / Terminal, x86_64 CPU.',
      theory: `The McCulloch-Pitts neuron (1943) accepts binary inputs and fires a binary output (0 or 1). The total input is calculated as y_in = sum(w_i * x_i). If y_in >= theta, the neuron fires (output = 1); otherwise output = 0. Excitatory inputs have weight +1 and inhibitory inputs have weight -1. For linearly separable gates (AND, OR, NOR), a single neuron with suitable weights and threshold suffices. For non-linearly separable patterns like XOR, two hidden neurons (Z1 = x1 AND NOT x2, Z2 = NOT x1 AND x2) and one output neuron (Y = Z1 OR Z2) are required.`,
      diagramAscii: `+-------------------------------------------------------+
|              McCulloch-Pitts XOR Architecture         |
|                                                       |
|   x1 ----[+1]----> [ Z1 ] ----[+1]----+               |
|      \\---[-1]---+  (θ=1)              |               |
|                 |                     v               |
|                 +-> [ Z2 ] ----[+1]--> [ Y ] (Output) |
|      /---[+1]---+  (θ=1)              (θ=1)           |
|   x2 ----[-1]----+                                    |
+-------------------------------------------------------+`,
      algorithm: [
        'Define a McCulloch-Pitts neuron function accepting inputs, weights, and threshold theta.',
        'Calculate net input y_in = sum(x_i * w_i).',
        'Apply threshold step function: return 1 if y_in >= theta else 0.',
        'For AND: set w = [1, 1], theta = 2.',
        'For OR: set w = [1, 1], theta = 1.',
        'For NOR: set w = [-1, -1], theta = 0.',
        'For XOR: calculate Z1 with w=[1, -1], theta=1; Z2 with w=[-1, 1], theta=1; Output Y with inputs=[Z1, Z2], w=[1, 1], theta=1.',
        'Validate outputs against all 4 binary permutations ((0,0), (0,1), (1,0), (1,1)).',
      ],
      code: `import numpy as np

def mp_neuron(inputs, weights, threshold):
    """McCulloch-Pitts artificial threshold unit."""
    net_input = np.dot(inputs, weights)
    return 1 if net_input >= threshold else 0

def simulate_gates():
    inputs = np.array([
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1]
    ])
    
    print("=== McCulloch-Pitts Neural Implementation ===")
    print("x1 | x2 | AND | OR | NOR | XOR")
    print("---+----+-----+----+-----+----")
    
    for x in inputs:
        # AND: w1=1, w2=1, theta=2
        y_and = mp_neuron(x, [1, 1], threshold=2)
        
        # OR: w1=1, w2=1, theta=1
        y_or = mp_neuron(x, [1, 1], threshold=1)
        
        # NOR: w1=-1, w2=-1, theta=0
        y_nor = mp_neuron(x, [-1, -1], threshold=0)
        
        # XOR (Two-Layer):
        # Z1 = x1 AND NOT x2: w=[1, -1], theta=1
        z1 = mp_neuron(x, [1, -1], threshold=1)
        # Z2 = NOT x1 AND x2: w=[-1, 1], theta=1
        z2 = mp_neuron(x, [-1, 1], threshold=1)
        # Y = Z1 OR Z2: w=[1, 1], theta=1
        y_xor = mp_neuron(np.array([z1, z2]), [1, 1], threshold=1)
        
        print(f" {x[0]} |  {x[1]} |  {y_and}  |  {y_or} |  {y_nor}  |  {y_xor}")

if __name__ == "__main__":
    simulate_gates()`,
      expectedInput: 'Four binary pairs: [0, 0], [0, 1], [1, 0], [1, 1]',
      expectedOutput: `=== McCulloch-Pitts Neural Implementation ===
x1 | x2 | AND | OR | NOR | XOR
---+----+-----+----+-----+----
 0 |  0 |  0  |  0 |  1  |  0
 0 |  1 |  0  |  1 |  0  |  1
 1 |  0 |  0  |  1 |  0  |  1
 1 |  1 |  1  |  1 |  0  |  0`,
      observation:
        '1. AND, OR, and NOR gates require only a single linear threshold boundary. 2. XOR cannot be separated by a single hyperplane (w1*x1 + w2*x2 >= theta leads to an algebraic contradiction). 3. The 2-layer decomposition successfully classifies the XOR diagonal patterns.',
      conclusion:
        'The McCulloch-Pitts neuron successfully realizes linearly separable functions with single-layer threshold units and computes non-linearly separable logic (XOR) using a multi-neuron layered network.',
      vivaQuestions: [
        {
          question: 'Why cannot a single McCulloch-Pitts neuron solve the XOR gate?',
          answer:
            'For XOR, inputs (0,0) and (1,1) produce 0, while (0,1) and (1,0) produce 1. Adding the inequality conditions for output 1 yields (w1+w2+b)+b >= 0, while the output 0 conditions demand both terms be strictly negative—a mathematical contradiction.',
        },
        {
          question:
            'What is the main limitation of the McCulloch-Pitts neuron compared to modern Perceptrons?',
          answer:
            'M-P neuron weights and thresholds are predetermined analytically by hand; it lacks an automated learning algorithm or weight-update mechanism like Delta Rule / Backpropagation.',
        },
        {
          question: 'What are excitatory and inhibitory inputs in an M-P neuron?',
          answer:
            'Excitatory inputs carry positive weights (+1) that drive the net sum toward the firing threshold, whereas inhibitory inputs carry negative weights (-1) that suppress firing.',
        },
        {
          question: 'What constitutes the threshold parameter theta?',
          answer:
            'Theta represents the minimum excitatory net activation required for the neuron to transition from an inactive state (0) to an active firing state (1).',
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. PRACTICAL GENERATION: Selenium WebDriver Automation (STQA)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'qp-practical-selenium-login',
    category: 'practical',
    title: 'Automate Login Verification using Selenium WebDriver',
    subtitle:
      'Positive & negative test suite, explicit waits, DOM selectors, and security injection checks',
    subject: 'Software Testing & Quality Assurance',
    subjectCode: 'ITDO7014',
    marks: 10,
    tags: ['Practical', 'STQA', 'Selenium', 'WebDriver', 'Automation', 'Python'],
    keywords: [
      'selenium',
      'webdriver',
      'login automation',
      'positive negative test cases',
      'explicit wait',
      'browser automation',
      'stqa practical',
      'test suite',
    ],
    answerMarkdown: `## 1. AIM
Apply Selenium WebDriver to automate the authentication functionality of a web application with positive, negative, and security boundary test cases.

---

## 2. APPARATUS & COMPONENTS
- **Programming Language:** Python 3.10+ / Java 17
- **Browser Driver:** Selenium WebDriver 4.x with ChromeDriver / GeckoDriver
- **Testing Framework:** pytest / TestNG
- **Target App:** University Portal Login Interface (\`https://portal.university.edu/login\`)

---

## 3. AUTOMATION ARCHITECTURE
\`\`\`
   +--------------------+       JSON Wire / W3C Protocol       +--------------------+
   | Selenium Test Code | ----------------------------------> | Browser Driver     |
   | (Python / PyTest)  |                                     | (chromedriver.exe) |
   +--------------------+                                     +--------------------+
             |                                                           |
             | Native Commands (click, sendKeys, wait)                  v
             +------------------------------------------------> +--------------------+
                                                                | Real Web Browser   |
                                                                | (Chrome / Firefox) |
                                                                +--------------------+
\`\`\`

---

## 4. TEST CASE MATRIX
| TC ID | Scenario Description | Input Data | Expected Result | Type |
|---|---|---|---|---|
| TC1 | Valid Credentials | \`user="valid_student"\`, \`pwd="SecurePass123!"\` | Redirected to \`/dashboard\`, auth token set | Positive |
| TC2 | Invalid Password | \`user="valid_student"\`, \`pwd="WrongPass"\` | Alert: "Invalid credentials" displayed | Negative |
| TC3 | Unregistered Username | \`user="unknown_xyz"\`, \`pwd="password123"\` | Alert: "Account not found" displayed | Negative |
| TC4 | Empty Fields | \`user=""\`, \`pwd=""\` | Inline validation: "Field is required" | Boundary |
| TC5 | SQL Injection Input | \`user="' OR '1'='1' --"\`, \`pwd="x"\` | Sanitized input, login refused safely | Security |`,
    practicalData: {
      aim: 'Apply Selenium WebDriver to automate the login functionality of a web application with positive and negative test cases.',
      apparatus: 'Python 3.10+, Selenium 4.20+, ChromeDriver, Chrome Browser, PyTest.',
      theory: `Selenium WebDriver automates real web browsers programmatically through the W3C WebDriver protocol. A login test navigates to the target URL, locates DOM input elements (By.ID, By.NAME, By.XPATH), simulates keyboard inputs via send_keys(), and triggers form dispatch via click(). Explicit synchronization (WebDriverWait with ExpectedConditions) is mandatory to prevent flaky tests resulting from asynchronous AJAX/DOM hydration.`,
      diagramAscii: `+-----------------------------------------------------------+
|               Selenium Login Automation Flow              |
|                                                           |
| [Start Browser] -> [Navigate URL] -> [Locate Username]   |
|                                            |              |
|                                            v              |
| [Click Submit] <-- [Send Password] <-- [Send Username]    |
|       |                                                   |
|       v                                                   |
| [Explicit Wait (10s)] -> [Verify Dashboard URL / Error]   |
|       |                                                   |
|       v                                                   |
| [Log Assertion & driver.quit()]                           |
+-----------------------------------------------------------+`,
      algorithm: [
        'Initialize Chrome WebDriver options with headless capabilities for CI/CD compatibility.',
        'Instantiate WebDriverWait with 10-second polling timeout.',
        'Navigate to application login endpoint.',
        'Locate username field by ID, clear existing text, and send test credentials.',
        'Locate password field by ID and send test secret.',
        'Locate and click submit button element.',
        'For positive path: wait for URL to contain /dashboard or presence of logout element.',
        'For negative path: wait for error toast / banner element visibility and assert error text.',
        'Tear down browser session cleanly with driver.quit() in finally block.',
      ],
      code: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

def run_login_suite():
    options = Options()
    options.add_argument("--headless=new")
    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 10)
    
    test_cases = [
        {"id": "TC1", "user": "valid_user", "pwd": "valid_password", "expect_dash": True},
        {"id": "TC2", "user": "valid_user", "pwd": "wrong_password", "expect_dash": False},
        {"id": "TC3", "user": "ghost_account", "pwd": "any_password", "expect_dash": False},
        {"id": "TC4", "user": "' OR '1'='1' --", "pwd": "sqli", "expect_dash": False}
    ]
    
    print("=== Selenium Automated Regression Test Suite ===")
    
    for tc in test_cases:
        driver.get("https://example.test/login")
        
        user_field = wait.until(EC.presence_of_element_located((By.ID, "username")))
        pass_field = driver.find_element(By.ID, "password")
        login_btn = driver.find_element(By.ID, "loginButton")
        
        user_field.clear()
        user_field.send_keys(tc["user"])
        pass_field.clear()
        pass_field.send_keys(tc["pwd"])
        login_btn.click()
        
        if tc["expect_dash"]:
            success = wait.until(EC.url_contains("/dashboard"))
            print(f"[{tc['id']}] Positive Auth Test: PASSED (Dashboard Reached)")
        else:
            err = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "error-msg")))
            assert err.is_displayed()
            print(f"[{tc['id']}] Negative Rejection Test: PASSED (Error displayed: '{err.text}')")
            
    driver.quit()
    print("Suite completed successfully.")

if __name__ == "__main__":
    run_login_suite()`,
      expectedInput:
        'Test credentials dictionary: valid accounts, wrong passwords, non-existent users, SQL injection strings.',
      expectedOutput: `=== Selenium Automated Regression Test Suite ===
[TC1] Positive Auth Test: PASSED (Dashboard Reached)
[TC2] Negative Rejection Test: PASSED (Error displayed: 'Invalid credentials')
[TC3] Negative Rejection Test: PASSED (Error displayed: 'User not found')
[TC4] Negative Rejection Test: PASSED (Error displayed: 'Invalid input format')
Suite completed successfully.`,
      observation:
        'Explicit synchronization prevents timing-induced NoSuchElementException errors. Negative test suites confirm input validation handles authentication failure securely without exposing server-side stack traces.',
      conclusion:
        'Selenium WebDriver reliably executes end-to-end regression tests across heterogeneous login scenarios with robust element synchronization.',
      vivaQuestions: [
        {
          question: 'What is the difference between driver.close() and driver.quit()?',
          answer:
            'driver.close() closes the currently active browser window. driver.quit() terminates all open windows and gracefully kills the underlying chromedriver process and OS daemon.',
        },
        {
          question: 'Why are explicit waits preferred over implicit waits or time.sleep()?',
          answer:
            'time.sleep() creates rigid, wasted idle time. Implicit waits apply globally across all element lookups. Explicit waits dynamically poll every 500ms for specific condition satisfactions, yielding maximum speed and reliability.',
        },
        {
          question: 'What is StaleElementReferenceException?',
          answer:
            'It occurs when an element originally referenced in memory is destroyed, detached, or refreshed in the DOM tree by an asynchronous AJAX update before a driver operation completes.',
        },
        {
          question: 'What is the role of Selenium Grid?',
          answer:
            'Selenium Grid orchestrates distributed, concurrent execution of test suites across multiple nodes running different operating systems, browsers, and device configurations in parallel.',
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. STANDARD Q&A: Activation Functions (AI & DS - II)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'qp-qa-activation-functions',
    category: 'qa',
    title: 'Activation Functions in Deep Learning: Properties, Plots & Comparison',
    subtitle: 'Sigmoid, Tanh, ReLU, Leaky ReLU, ELU, Softmax mathematical breakdown',
    subject: 'AI and DS – II',
    subjectCode: 'ITC701',
    marks: 10,
    tags: ['Theory', 'Neural Networks', 'Deep Learning', 'Activation Functions'],
    keywords: [
      'activation function',
      'sigmoid',
      'tanh',
      'relu',
      'leaky relu',
      'elu',
      'softmax',
      'vanishing gradient',
      'properties of activation function',
    ],
    answerMarkdown: `## Q: What are the important properties of activation function used in neural network? Explain all the activation functions with neat diagram. (10 Marks)

---

### 1. Definition & Core Role
An activation function computes the output of a neuron from its net weighted input:
$$y = f\\left(\\sum_{i=1}^{n} w_i x_i + b\\right)$$
Its fundamental role is to introduce **non-linearity** into the network. Without non-linear activation functions, a neural network with arbitrary depth collapses algebraically into a single linear transformation:
$$W_2(W_1 x + b_1) + b_2 = (W_2 W_1)x + (W_2 b_1 + b_2) = W_{\\text{eff}} x + b_{\\text{eff}}$$

---

### 2. Important Properties of an Activation Function
1. **Non-linearity:** Enables the network to compute universal functional approximations and learn complex non-convex decision boundaries.
2. **Differentiability:** Must be differentiable (or sub-differentiable) across its domain so gradients can be propagated backward during gradient descent:
   $$\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial y} \\cdot f'(y_{\\text{in}}) \\cdot x$$
3. **Monotonicity:** Ensures that error surfaces for single-layer representations remain convex, aiding optimization.
4. **Zero-Centered Output:** Prevents zig-zag gradient dynamics during backpropagation; symmetric activations centered around zero accelerate training.
5. **Mitigation of Vanishing/Exploding Gradients:** Derivative should not saturate to zero across wide input ranges (unlike Sigmoid for $|x| \\gg 0$).
6. **Computational Efficiency:** Cheap arithmetic evaluation because it executes millions of times per forward-backward pass.

---

### 3. Comprehensive Classification & Mathematical Comparison
\`\`\`
+--------------------+-------------------------------------------+---------------+--------------------------------------+-------------------------------------------------+
| Function           | Formula & Derivative                      | Output Range  | Key Advantages                       | Disadvantages / Primary Use                     |
+--------------------+-------------------------------------------+---------------+--------------------------------------+-------------------------------------------------+
| Binary Step        | f(x) = 1 if x >= θ else 0                 | {0, 1}        | Trivial computation                  | Not differentiable (f'=0); binary threshold only|
| Linear (Identity)  | f(x) = x, f'(x) = 1                       | (-∞, +∞)      | Unbounded dynamic range              | No non-linearity; regression output layer only  |
| Sigmoid (Logistic) | f(x) = 1 / (1 + e^-x), f' = f(1 - f)      | (0, 1)        | Output maps directly to probability  | Vanishing gradient; non zero-centered; binary op|
| Tanh               | f(x) = (e^x - e^-x)/(e^x + e^-x), f'=1-f² | (-1, 1)       | Zero-centered; steeper gradients     | Still saturates for large |x|; hidden RNN/LSTM  |
| ReLU               | f(x) = max(0, x), f' = 1 (x>0), 0 (x<0)   | [0, +∞)       | Blazing fast; avoids saturation      | Dying ReLU (dead neurons); default for CNN/MLP  |
| Leaky ReLU         | f(x) = x (x>0), αx (x<=0, α≈0.01)         | (-∞, +∞)      | Prevents dying neurons completely    | α is an additional hyperparameter               |
| ELU                | f(x) = x (x>0), α(e^x - 1) (x<=0)         | (-α, +∞)      | Smooth transition; mean zero output  | Exponential calculation overhead                |
| Softmax            | f(z_i) = e^z_i / Σ e^z_j                  | (0, 1), Σ=1   | Multi-class probability distribution | Exclusive to multi-class output layer           |
+--------------------+-------------------------------------------+---------------+--------------------------------------+-------------------------------------------------+
\`\`\`

---

### 4. Activation Function Geometric Plots (ASCII)
\`\`\`
      Sigmoid                     Tanh                          ReLU
   1 |        ....-''          1 |          ..---''          |          /
     |      .'                   |        .'                 |         /
 0.5 |-----+                     |-------+-------            |        /
     |   .'                      |     .'                    |       /
   0 +--'-------               -1 +---'---------           0 +------+--------
        Negative  0  Positive          -2   0   +2                -2  0  +2
\`\`\`

---

### 5. Architectural Recommendations
- **Hidden Layers (Default):** Use **ReLU** for standard CNN/MLP architectures due to computational speed and non-saturating gradients. Use **Leaky ReLU / GELU** when dying neurons are observed.
- **Hidden Layers (Recurrent):** Use **Tanh** for RNN / LSTM recurrent cells to maintain bounded memory representations.
- **Output Layer:** Use **Sigmoid** for binary classification, **Softmax** for multi-class classification, and **Linear** for continuous regression.`,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. STANDARD Q&A: LSTM Deep Architecture (AI & DS - II)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'qp-qa-lstm-architecture',
    category: 'qa',
    title: 'Long Short-Term Memory (LSTM) Networks: Architecture & Gate Mathematics',
    subtitle: 'Cell state highway, forget, input, output gates, and vanishing gradient mitigation',
    subject: 'AI and DS – II',
    subjectCode: 'ITC701',
    marks: 10,
    tags: ['Theory', 'LSTM', 'RNN', 'Deep Learning', 'Sequence Modeling'],
    keywords: [
      'lstm',
      'long short term memory',
      'cell state',
      'forget gate',
      'input gate',
      'output gate',
      'vanishing gradient',
      'recurrent neural network',
      'bptt',
    ],
    answerMarkdown: `## Q: Explain LSTM in detail: architecture, why it is needed, gate equations, and advantages. (10 Marks)

---

### 1. Why LSTM is Needed
Standard Recurrent Neural Networks (RNNs) update their hidden state by repeated matrix multiplication across time steps:
$$h_t = \\tanh(W_{hh} h_{t-1} + W_{xh} x_t + b)$$
During **Back-Propagation Through Time (BPTT)**, computing the gradient across $T$ steps involves repeated factor products:
$$\\frac{\\partial L}{\\partial h_1} = \\prod_{t=2}^{T} \\frac{\\partial h_t}{\\partial h_{t-1}} \\cdot \\frac{\\partial L}{\\partial h_T}$$
If the eigenvalues of $W_{hh}$ are $< 1$ (or using saturating $\\tanh$ where $\\tanh' \\le 1$), the gradient decays exponentially to zero (**vanishing gradient problem**). The standard RNN cannot bridge dependencies longer than 8–10 time steps.

---

### 2. The Core Innovation: The Constant Error Carousel (Cell State)
LSTM (Hochreiter & Schmidhuber, 1997) introduces a linear **Cell State ($C_t$)** that runs horizontally through the entire sequence like a conveyor belt, with minimal linear interactions:
$$C_t = f_t \\odot C_{t-1} + i_t \\odot \\tilde{C}_t$$
Information can flow indefinitely without exponential decay because the gradient propagates additively rather than purely multiplicatively.

---

### 3. Detailed Gate Equations
At time step $t$, given current input $x_t$, previous hidden state $h_{t-1}$, and previous cell state $C_{t-1}$:

1. **Forget Gate ($f_t$):** Decides what information to purge from the cell state:
   $$f_t = \\sigma\\left(W_f \\cdot [h_{t-1}, x_t] + b_f\\right) \\in [0, 1]$$
   *(0 = forget completely, 1 = preserve entirely)*

2. **Input Gate ($i_t$):** Decides which dimensions of new information to update:
   $$i_t = \\sigma\\left(W_i \\cdot [h_{t-1}, x_t] + b_i\\right)$$

3. **Candidate Cell State ($\\tilde{C}_t$):** Synthesizes new candidate knowledge:
   $$\\tilde{C}_t = \\tanh\\left(W_c \\cdot [h_{t-1}, x_t] + b_c\\right)$$

4. **Cell State Update ($C_t$):** Forgets old memory and adds gated new memory:
   $$C_t = f_t \\odot C_{t-1} + i_t \\odot \\tilde{C}_t$$

5. **Output Gate ($o_t$):** Decides what filtered portion of the cell state forms the output:
   $$o_t = \\sigma\\left(W_o \\cdot [h_{t-1}, x_t] + b_o\\right)$$

6. **Hidden State Output ($h_t$):**
   $$h_t = o_t \\odot \\tanh(C_t)$$

---

### 4. LSTM Cell Internal Architecture (ASCII)
\`\`\`
                     C(t-1) -----------------[ X ]-----------------(+)-----------------> C(t)
                                              ^                     ^
                                              | f(t)                | [ i(t) * C~(t) ]
                                            +---+                 +---+
                                            | σ |                 | X |
                                            +---+                 +---+
                                              |                   /   \\
                                              |          +---+   /     \\   +------+
                                              |          | σ | -+       +- | tanh |
                                              |          +---+             +------+
                                              |            | i(t)             |
                                              |            |                  |
                                              |            |                  v
                                              |            |               +------+
                     h(t-1) ---+--------------+------------+--------->     | tanh |
                               |                                           +------+
                               |                                              |
                               |                                              v
                               |                                            +---+
                               |                                            | X | ------> h(t)
                               |                                            +---+
                               |                                              ^
                               |                                       o(t)   |
                               |                                            +---+
                               +------------------------------------------> | σ |
                               |                                            +---+
                     x(t) -----+
\`\`\`

---

### 5. Summary of Advantages & Practical Applications
- **Long-term Retention:** Capable of preserving context over 100+ tokens.
- **Applications:** Machine translation (Seq2Seq), stock and financial time-series forecasting, audio speech recognition, ECG anomaly detection.
- **Variants:** **GRU (Gated Recurrent Unit)** merges cell and hidden states and uses only 2 gates (Reset and Update), reducing parameters by 25%.`,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. STANDARD Q&A: HTTP vs WebSocket for IoT (IoE)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'qp-qa-http-websocket-ioe',
    category: 'qa',
    title: 'HTTP vs WebSocket in IoT Communication: Protocols & Trade-Offs',
    subtitle: 'Full-duplex vs request-response, packet overhead, handshake & telemetry streaming',
    subject: 'Internet of Everything',
    subjectCode: 'ITC702',
    marks: 5,
    tags: ['Theory', 'IoT', 'Protocols', 'Networking', 'WebSockets'],
    keywords: [
      'http vs websocket',
      'iot protocols',
      'full duplex',
      'request response',
      'websocket handshake',
      'rfc 6455',
      'header overhead',
      'telemetry streaming',
    ],
    answerMarkdown: `## Q: Differentiate between HTTP and WebSocket protocols for IoT communication. Explain the WebSocket handshake mechanism. (5 Marks)

---

### 1. Protocol Comparison Matrix
\`\`\`
+-----------------------+----------------------------------------------+-----------------------------------------------+
| Parameter             | HTTP (Hypertext Transfer Protocol)           | WebSocket (RFC 6455)                          |
+-----------------------+----------------------------------------------+-----------------------------------------------+
| Communication Model   | Half-duplex; strict client-initiated request | Full-duplex, bi-directional; peer-to-peer     |
| Connection State      | Stateless; new TCP session per exchange      | Stateful; persistent single open TCP pipe     |
| Header Overhead       | Heavy (500–1000+ bytes per request)          | Lightweight (2 to 14 bytes per frame)         |
| Server Push           | Not native (requires polling or SSE)         | Native; server pushes telemetry instantaneously|
| Latency               | High (round-trip connection establishment)   | Sub-millisecond once established              |
| Scheme & Default Port | http:// (80), https:// (443)                 | ws:// (80), wss:// (443)                      |
| Primary IoT Role      | Periodic firmware checks, REST cloud queries | Real-time sensor streaming, industrial alarms |
+-----------------------+----------------------------------------------+-----------------------------------------------+
\`\`\`

---

### 2. The WebSocket Upgrade Handshake Mechanism
WebSocket establishes bi-directional streaming over standard HTTP ports through an **Upgrade handshake**:

\`\`\`
1. Client HTTP GET Request:
   GET /telemetry HTTP/1.1
   Host: iot-broker.university.edu
   Upgrade: websocket
   Connection: Upgrade
   Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
   Sec-WebSocket-Version: 13

2. Server Response (101 Switching Protocols):
   HTTP/1.1 101 Switching Protocols
   Upgrade: websocket
   Connection: Upgrade
   Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=

3. Persistent Full-Duplex TCP Framing:
   Client <=================== [Binary/Text Frames] ===================> Server
\`\`\`

---

### 3. IoT Use Case Comparison
- **HTTP Scenario:** Smart agriculture soil moisture sensor sending readings every 6 hours. The connection terminates immediately after sending, conserving battery power.
- **WebSocket Scenario:** Autonomous vehicle proximity radar or industrial robotic arm dashboard requiring continuous 50Hz position updates with immediate server override triggers.`,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. STANDARD Q&A: Bagging vs Boosting (AI & DS - II)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'qp-qa-bagging-boosting',
    category: 'qa',
    title: 'Bagging vs Boosting Ensemble Classifiers: Deep Comparison & Algorithms',
    subtitle:
      'Bootstrap aggregation, Out-of-bag data, AdaBoost weights, variance vs bias reduction',
    subject: 'AI and DS – II',
    subjectCode: 'ITC701',
    marks: 10,
    tags: ['Theory', 'Machine Learning', 'Ensemble Learning', 'Bagging', 'Boosting'],
    keywords: [
      'bagging',
      'boosting',
      'ensemble learning',
      'adaboost',
      'random forest',
      'bootstrap aggregating',
      'variance reduction',
      'bias reduction',
      'oob error',
    ],
    answerMarkdown: `## Q: Explain Bagging and Boosting in detail with algorithm steps and a detailed comparison. (10 Marks)

---

### 1. Conceptual Framework of Ensemble Learning
Ensemble learning combines predictions from multiple base models (weak learners) to construct a superior composite model that demonstrates higher accuracy, resilience against noise, and generalization capability.
- **Bagging** addresses **high variance** (over-fitting).
- **Boosting** addresses **high bias** (under-fitting).

---

### 2. Bagging (Bootstrap Aggregating)
1. **Sampling:** Given dataset $D$ of size $N$, draw $k$ independent bootstrap samples $D_1, D_2, \\dots, D_k$ with replacement ($|D_i| = N$).
2. **Mathematical Property:** The probability of a tuple being omitted from a bootstrap sample is:
   $$\\lim_{N \\to \\infty} \\left(1 - \\frac{1}{N}\\right)^N = e^{-1} \\approx 0.368 \\text{ (36.8\\% Out-of-Bag)}$$
3. **Training:** Train $k$ base learners (e.g., unpruned Decision Trees) **in parallel**.
4. **Aggregation:**
   - Classification: Majority voting: $\\hat{y} = \\text{mode}(h_1(x), \\dots, h_k(x))$
   - Regression: Arithmetic mean: $\\hat{y} = \\frac{1}{k}\\sum_{j=1}^{k} h_j(x)$

---

### 3. Boosting (Adaptive Sequential Weighting)
1. Initialize equal weight for all training tuples: $w_i^{(1)} = \\frac{1}{N}$.
2. For round $t = 1$ to $T$:
   - Train weak learner $h_t$ using the weighted distribution.
   - Compute weighted classification error:
     $$\\epsilon_t = \\sum_{i: h_t(x_i) \\ne y_i} w_i^{(t)}$$
   - Compute learner significance stage weight:
     $$\\alpha_t = \\frac{1}{2} \\ln\\left(\\frac{1 - \\epsilon_t}{\\epsilon_t}\\right)$$
   - Update instance weights (penalizing misclassified samples):
     $$w_i^{(t+1)} = \\frac{w_i^{(t)}}{Z_t} \\times \\begin{cases} e^{-\\alpha_t} & \\text{if } h_t(x_i) = y_i \\\\ e^{+\\alpha_t} & \\text{if } h_t(x_i) \\ne y_i \\end{cases}$$
3. Final ensemble decision (Weighted Vote):
   $$H(x) = \\text{sign}\\left(\\sum_{t=1}^{T} \\alpha_t h_t(x)\\right)$$

---

### 4. Architectural Comparison (ASCII)
\`\`\`
   BAGGING (Parallel Training):               BOOSTING (Sequential Correction):
        [ Training Dataset ]                      [ Weighted Data D1 ]
        /        |         \\                               |
   [Sample 1] [Sample 2] [Sample 3]                        v
       |         |         |                       [ Model 1 (Weak) ]
       v         v         v                               | (increase weights of errors)
   [Model 1] [Model 2] [Model 3]                           v
        \\        |         /                      [ Weighted Data D2 ]
         v       v        v                                |
     [ Majority Voting ]                                   v
             |                                     [ Model 2 (Corrective) ]
             v                                             |
     [ Final Output ]                                      v
                                                   [ Weighted Vote H(x) ]
\`\`\`

---

### 5. Detailed Comparison Table
| Feature | Bagging (Bootstrap Aggregation) | Boosting (e.g., AdaBoost, XGBoost) |
|---|---|---|
| **Learner Relationship** | Independent, trained in parallel | Dependent, trained sequentially |
| **Data Sampling** | Random bootstrap samples with replacement | Full dataset with dynamically adaptive sample weights |
| **Objective Goal** | Reduces Variance (prevents overfitting) | Reduces Bias (turns weak learners into strong learner) |
| **Combination Rule** | Simple majority vote or uniform average | Weighted vote based on stage accuracy $\\alpha_t$ |
| **Outlier Sensitivity** | Robust to noise and mislabeled data | Highly sensitive to outliers (weights escalate on noise) |
| **Exemplar Algorithms** | Random Forest, Bagged Decision Trees | AdaBoost, Gradient Boosting, CatBoost, XGBoost |`,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. PYQ ANALYSIS: Confusion Matrix & Metrics (AI & DS - II)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'qp-pyq-confusion-matrix',
    category: 'pyq',
    title: 'Confusion Matrix Analysis & Solved Numerical Problem',
    subtitle:
      'Step-by-step calculation for TP=90, FP=10, FN=20, TN=80 with precision-recall trade-off',
    subject: 'AI and DS – II',
    subjectCode: 'ITC701',
    marks: 10,
    tags: ['PYQ', 'Exam Solution', 'Confusion Matrix', 'Classification Metrics', 'Numerical'],
    keywords: [
      'confusion matrix',
      'accuracy',
      'precision',
      'recall',
      'sensitivity',
      'specificity',
      'f1 score',
      'numerical calculation',
      'type 1 error',
      'type 2 error',
    ],
    answerMarkdown: `## Q: Explain Confusion Matrix with examples. For TP=90, FP=10, FN=20, TN=80, compute Accuracy, Precision, Error Rate, Sensitivity, Specificity, and F1-Score with interpretation. (10 Marks)

---

### 1. Structure of the Binary Confusion Matrix
A confusion matrix benchmarks predicted classifications against verified actual target labels:
\`\`\`
                        PREDICTED CLASS
                     Positive          Negative
ACTUAL   Positive | TP (True Pos)   | FN (False Neg) | -> Total Actual Pos = TP + FN
CLASS    Negative | FP (False Pos)  | TN (True Neg)  | -> Total Actual Neg = FP + TN
                    --------------------------------
                    Pred Pos = TP+FP  Pred Neg = FN+TN  Grand Total = N
\`\`\`
- **Type I Error (FP):** False alarm (e.g., legitimate mail marked as spam).
- **Type II Error (FN):** Missed hazard (e.g., fraudulent transaction labeled legitimate).

---

### 2. Standard Metric Formulations
1. **Accuracy:** $\\frac{TP + TN}{TP + TN + FP + FN}$ (Total correct predictions)
2. **Precision:** $\\frac{TP}{TP + FP}$ (Reliability of positive alarms)
3. **Recall (Sensitivity / TPR):** $\\frac{TP}{TP + FN}$ (Coverage of actual positive instances)
4. **Specificity (TNR):** $\\frac{TN}{TN + FP}$ (Correct identification of negative class)
5. **Error Rate:** $\\frac{FP + FN}{Total} = 1 - \\text{Accuracy}$
6. **F1-Score:** $\\frac{2 \\times \\text{Precision} \\times \\text{Recall}}{\\text{Precision} + \\text{Recall}} = \\frac{2TP}{2TP + FP + FN}$

---

### 3. Step-by-Step Numerical Solution
**Given Data:**
- $TP = 90$
- $FP = 10$
- $FN = 20$
- $TN = 80$
- **Total Population ($N$):** $90 + 10 + 20 + 80 = 200$

#### Calculation 1: Overall Accuracy
$$\\text{Accuracy} = \\frac{90 + 80}{200} = \\frac{170}{200} = \\mathbf{0.850 \\text{ (85.0\\%)}}$$

#### Calculation 2: Precision
$$\\text{Precision} = \\frac{90}{90 + 10} = \\frac{90}{100} = \\mathbf{0.900 \\text{ (90.0\\%)}}$$

#### Calculation 3: Error Rate
$$\\text{Error Rate} = \\frac{10 + 20}{200} = \\frac{30}{200} = \\mathbf{0.150 \\text{ (15.0\\%)}}$$

#### Calculation 4: Sensitivity (Recall)
$$\\text{Recall} = \\frac{90}{90 + 20} = \\frac{90}{110} = \\mathbf{0.8182 \\text{ (81.82\\%)}}$$

#### Calculation 5: Specificity
$$\\text{Specificity} = \\frac{80}{80 + 10} = \\frac{80}{90} = \\mathbf{0.8889 \\text{ (88.89\\%)}}$$

#### Calculation 6: F1-Score
$$F_1 = 2 \\times \\frac{0.900 \\times 0.8182}{0.900 + 0.8182} = \\frac{1.4727}{1.7182} = \\mathbf{0.8571}$$
*(Verification using raw values: $\\frac{2(90)}{2(90) + 10 + 20} = \\frac{180}{210} = 0.8571$)*

---

### 4. Academic Interpretation & Mark Criteria
- **Model Assessment:** The classifier correctly predicts 85% of all samples, with a high precision of 90% and recall of 81.8%.
- **Cost Trade-off:** In fraud detection or cancer diagnostics, the 20 False Negatives (misses) carry far higher operational danger than the 10 False Positives. Hence, tuning decision thresholds to optimize Recall over Accuracy is critical.`,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. PYQ ANALYSIS: McCall's Quality Factors for Banking (STQA)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'qp-pyq-mccall-banking',
    category: 'pyq',
    title: "McCall's Quality Factors: Internet Banking Application & Conflict Analysis",
    subtitle:
      'Product operation, revision, transition, and the critical Integrity vs Usability trade-off',
    subject: 'Software Testing & Quality Assurance',
    subjectCode: 'ITDO7014',
    marks: 10,
    tags: ['PYQ', 'STQA', 'Quality Assurance', 'McCall Model', 'Internet Banking'],
    keywords: [
      'mccall quality factors',
      'internet banking quality',
      'product operation',
      'integrity vs usability',
      'software metrics',
      'stqa pyq',
    ],
    answerMarkdown: `## Q: Analyze McCall's quality factors and criteria for an Internet Banking application. Identify the factors most critical to its success with justification, and evaluate the trade-off (conflict) between any two quality factors. (10 Marks)

---

### 1. McCall's Three-Tier Software Quality Taxonomy
McCall's model categorizes software quality into **11 factors** across 3 foundational perspectives:

\`\`\`
                           McCall's 11 Quality Factors
                                        |
       +--------------------------------+--------------------------------+
       |                                |                                |
  [PRODUCT OPERATION]             [PRODUCT REVISION]            [PRODUCT TRANSITION]
  (How well does it run?)         (How easily is it changed?)   (How well does it port?)
  - Correctness                   - Maintainability             - Portability
  - Reliability                   - Flexibility                 - Reusability
  - Efficiency                    - Testability                 - Interoperability
  - Integrity (Security)
  - Usability
\`\`\`

---

### 2. Application of Factors to an Internet Banking System
| Quality Factor | Banking Domain Evaluation Criteria | Real-World Failure Consequence |
|---|---|---|
| **Integrity** | Multi-factor authentication (MFA), role-based access control, cryptographic non-repudiation | Account takeover, fund draining, regulatory sanction |
| **Reliability** | 99.999% availability, zero transaction loss during network timeout, ACID compliance | Double debiting, uncredited RTGS/NEFT transfers |
| **Correctness** | Precise compounding interest calculations, ledger ledger balance reconciliation | Financial statement inaccuracy, compliance violation |
| **Efficiency** | Response latency < 1.5s during high-volume salary credit peak hours | Payment gateway timeouts, shopping cart abandonment |
| **Usability** | Clear fund transfer confirmations, accessible mobile UI for seniors | Erroneous recipient transfers, high customer support load |
| **Interoperability**| Secure API hooks to NPCI UPI, SWIFT, payment gateways, credit bureaus | Inability to process merchant checkout payments |

---

### 3. Most Critical Factor Justification: INTEGRITY
**Integrity (Security)** is undeniably the single most critical quality factor for an Internet Banking application:
- **Catastrophic Impact:** A breach in integrity destroys customer trust, incurs multi-million dollar regulatory penalties (RBI / GDPR), and risks systemic financial collapse.
- **Prerequisite for Operation:** While a banking portal with modest usability or maintainability can remain operational, a portal with compromised integrity is an existential business failure.

---

### 4. Trade-off Analysis: Integrity (Security) vs. Usability
A natural tension exists between rigorous security controls and frictionless user experience:

\`\`\`
   [ MAXIMAL INTEGRITY ]                                 [ MAXIMAL USABILITY ]
   - 3-Factor Auth (Password + SMS + Biometric)          - 1-Click biometric instant transfer
   - 60-second idle session timeout                      - Persistent 30-day login session
   - Re-enter password for every beneficiary             - Immediate unverified beneficiary dispatch
   - Captcha verification on every screen                - Clean, minimal, zero-interruption UI
\`\`\`

#### Resolution Strategy:
Modern banking architectures solve this conflict through **Risk-Based Step-Up Authentication**:
1. Common, low-risk actions (checking account balance, viewing mini-statements) require minimal verification (biometric/PIN) for peak **Usability**.
2. High-risk actions (adding unknown beneficiary, transfers exceeding ₹25,000, profile password reset) trigger immediate stepped-up challenge (MFA, OTP, cool-off period) to enforce **Integrity** precisely when risk spikes.`,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. SMART DIGITAL MODULES: Suffix Trees & Suffix Arrays (IRS)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'qp-smart-suffix-structures',
    category: 'smart_module',
    title: "Suffix Trees & Suffix Arrays: Pattern Searching 'ana' in 'banana'",
    subtitle:
      'Compressed trie vs lexicographic array, binary search algorithm, and space-time complexity',
    subject: 'Information Retrieval Systems',
    subjectCode: 'ITDO7024',
    marks: 10,
    tags: ['Smart Module', 'IRS', 'Suffix Tree', 'Suffix Array', 'Full Text Indexing'],
    keywords: [
      'suffix tree',
      'suffix array',
      'banana search ana',
      'full text indexing',
      'compressed trie',
      'information retrieval systems',
      'pattern matching',
    ],
    answerMarkdown: `## Q: Explain Suffix Trees and Suffix Arrays with an example. Show how the pattern 'ana' is searched in the text 'banana'. (10 Marks)

---

### 1. Problem Formulation & Concept
In full-text indexing of plain character sequences (DNA sequences, phrase search, non-segmented languages), word-based inverted indexes cannot be built because there are no word boundaries. **Suffix-based structures** solve this by indexing every character position $i$ through to the end of the text.

Given text $T = \\text{"banana"}$, an end marker $\\$$ (lexicographically smaller than all characters) is appended:
$$T = \\text{"banana\\$"}$$

#### Enumeration of All 7 Suffixes:
| Suffix Index ($i$) | Suffix Substring |
|:---:|---|
| **1** | \`banana$\` |
| **2** | \`anana$\` |
| **3** | \`nana$\` |
| **4** | \`ana$\` |
| **5** | \`na$\` |
| **6** | \`a$\` |
| **7** | \`$\` |

---

### 2. Suffix Array Construction
A Suffix Array ($SA$) stores the starting indices of all suffixes sorted in **lexicographical (alphabetical) order**:

\`\`\`
   Sorted Order:
   1. "$"        --> Index 7
   2. "a$"       --> Index 6
   3. "ana$"     --> Index 4
   4. "anana$"   --> Index 2
   5. "banana$"  --> Index 1
   6. "na$"      --> Index 5
   7. "nana$"    --> Index 3

   => Suffix Array: SA = [7, 6, 4, 2, 1, 5, 3]
\`\`\`

---

### 3. Suffix Tree Architecture (ASCII)
A Suffix Tree is a compressed trie where each leaf contains the 1-based start position:
\`\`\`
                            ( root )
            /             /          \\           \\
         "a"          "banana$"      "na"        "$"
        /   \\             |          /   \\        |
      "$"   "na"       [leaf 1]    "$"  "na$"   [leaf 7]
       |    /   \\                   |      |
    [leaf 6] "$"  "na$"          [leaf 5] [leaf 3]
              |      |
          [leaf 4] [leaf 2]
\`\`\`

---

### 4. Searching Pattern $P = \\text{"ana"}$
#### Method A: Using Suffix Tree
1. From \`root\`, follow edge matching prefix \`"a"\` $\\to$ reaches internal node $A$.
2. From internal node $A$, follow edge matching \`"na"\` $\\to$ reaches internal node $A_2$.
3. The pattern \`"ana"\` is completely consumed.
4. Collect all leaves below node $A_2$:
   - Leaf **4** (\`ana$\`)
   - Leaf **2** (\`anana$\`)
5. **Result:** \`"ana"\` occurs at text positions **2** and **4** (\`b[ana]na\` and \`ban[ana]\`).

#### Method B: Using Suffix Array (Binary Search)
Because all suffixes starting with \`"ana"\` appear contiguously in $SA$:
1. Check mid index $4 \\to SA[4] = 2 \\to$ suffix \`"anana$"\`. Compare first 3 chars: \`"ana" == "ana"\` (Match!).
2. Check left neighbor $3 \\to SA[3] = 4 \\to$ suffix \`"ana$"\`. Compare first 3 chars: \`"ana" == "ana"\` (Match!).
3. Check left neighbor $2 \\to SA[2] = 6 \\to$ suffix \`"a$"\` $\\ne$ \`"ana"\` (Stop left).
4. Check right neighbor $5 \\to SA[5] = 1 \\to$ suffix \`"banana$"\` $\\ne$ \`"ana"\` (Stop right).
5. **Occurrences found at $SA[3]=4$ and $SA[4]=2$.**

---

### 5. Architectural Comparison Matrix
| Dimension | Suffix Tree | Suffix Array |
|---|---|---|
| **Underlying Structure** | Compressed Trie (Nodes, Edges, Pointers) | Contiguous integer array of size $N$ |
| **Space Overhead** | $O(N)$ with large constant ($10N$–$20N$ bytes) | $O(N)$ compact ($4N$ bytes in 32-bit int) |
| **Search Time for Pattern Length $m$** | $O(m)$ deterministic | $O(m \\log N)$ binary search |
| **Cache Friendliness** | Low (pointer chasing across heap) | High (contiguous sequential memory access) |`,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. SMART DIGITAL MODULES: Smart Home IoT Ecosystem (IoE)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'qp-smart-home-ecosystem',
    category: 'smart_module',
    title: 'Smart Home IoT Ecosystem: Sensors, Actuators, Hubs, Protocols & Security',
    subtitle:
      'End-to-end multi-tier architecture, Zigbee/Matter integration, and edge-to-cloud analytics',
    subject: 'Internet of Everything',
    subjectCode: 'ITC702',
    marks: 10,
    tags: ['Smart Module', 'IoE', 'Smart Home', 'IoT Architecture', 'Home Automation'],
    keywords: [
      'smart home ecosystem',
      'iot sensors actuators',
      'home assistant',
      'zigbee matter',
      'mqtt smart home',
      'vlan isolation',
      'smart home security',
      'edge hub',
    ],
    answerMarkdown: `## Q: Explain the ecosystem for an IoT-enabled Smart Home with respect to sensors, actuators, framework, protocols, storage, data analysis, and security. (10 Marks)

---

### 1. Conceptual Overview
A modern IoT-enabled Smart Home is a unified distributed computing environment where heterogeneous edge devices continuously sense environmental variables, communicate over mesh protocols to local hubs, and trigger autonomous actuation based on localized rules and cloud analytics.

---

### 2. Multi-Layer Smart Home Architecture (ASCII)
\`\`\`
   +-------------------------------------------------------------------------+
   |                        CLOUD LAYER & MOBILE APPS                         |
   |   - Remote Dashboards (iOS/Android)   - Voice (Alexa, Siri, G-Assistant)|
   |   - Long-term Time Series Analytics   - Over-the-Air (OTA) Updates      |
   +-------------------------------------------------------------------------+
                                        ^
                                        | TLS 1.3 / MQTT / HTTPS
                                        v
   +-------------------------------------------------------------------------+
   |                        LOCAL GATEWAY / HUB LAYER                         |
   |   - Home Assistant / openHAB / Apple HomeKit                            |
   |   - Local Rule Engine ("If motion after 11 PM -> Siren ON")             |
   |   - Local Storage: InfluxDB / SQLite (Privacy-Preserving)               |
   +-------------------------------------------------------------------------+
          ^                       ^                         ^
          | Zigbee 3.0 / Matter   | Thread / BLE Mesh       | Wi-Fi (802.11ax)
          v                       v                         v
   +-----------------------+ +-----------------------+ +---------------------+
   | SENSORS (Data In)     | | ACTUATORS (Action Out)| | HYBRID APPLIANCES   |
   | - Motion (PIR)        | | - Smart Relays / Plugs| | - Smart Thermostat  |
   | - Temp/Humidity (DHT) | | - Motorized Blinds    | | - IP Camera (RTSP)  |
   | - Smoke / LPG Gas     | | - Smart Door Deadbolt | | - Smart EV Charger  |
   | - Window Contact Reed | | - Water Shutoff Valve | | - Smart Lighting     |
   +-----------------------+ +-----------------------+ +---------------------+
\`\`\`

---

### 3. Detailed Component Breakdown
1. **Sensors (Input Layer):**
   - *Environmental:* DHT22 (temperature/humidity), MQ-2 (smoke and combustible gas).
   - *Security & Presence:* Passive Infrared (PIR) motion detectors, Hall-effect magnetic door/window contact reeds, ultrasonic water tank level monitors.
2. **Actuators (Execution Layer):**
   - High-amperage solid-state relays (smart plugs), motorized brass ball valves (emergency water leak shutoff), brushless motor drives (curtain/blind control), magnetic solenoid door locks.
3. **Software Framework (Hub & Orchestration):**
   - Open-source platforms like **Home Assistant** or **openHAB** deployed on local edge nodes (Raspberry Pi 5 / Intel NUC).
   - Keeps core automation functioning 100% offline without reliance on public cloud infrastructure.
4. **Protocols & Connectivity:**
   - *Device-to-Hub:* **Zigbee 3.0** and **Matter over Thread** (ultra-low power 2.4GHz mesh, self-healing).
   - *Hub-to-Cloud:* **MQTT with TLS** on port 8883 for telemetry messaging; HTTPS for webhooks.
5. **Storage Architecture:**
   - *Hot Tier (Edge):* SQLite and InfluxDB on the local hub storing 30-day sensor telemetry at 1-minute intervals.
   - *Cold Tier (Cloud):* AWS S3 / Google Cloud Storage for compressed historical backups and compliance logs.
6. **Data Analysis & Automation:**
   - Real-time rule evaluation (e.g., *“If Door Sensor opens AND House Mode == Armed, trigger Siren AND send push alert”*).
   - Machine learning anomaly detection for baseline electrical consumption signatures.
7. **Security & Privacy Defense in Depth:**
   - **VLAN Isolation:** IoT hardware placed on a dedicated, isolated VLAN without access to personal laptops or NAS drives.
   - **Local Processing:** Video feeds analyzed on-edge (e.g., Frigate NVR) to prevent streaming private home cameras to external cloud servers.
   - **Encrypted Payloads:** Device authentication via pre-shared hardware keys and TLS 1.3 encryption.`,
  },
];
