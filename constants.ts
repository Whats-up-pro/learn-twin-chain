import { LearningModule, LearnerProfile, DigitalTwin } from './types';
import { getCurrentVietnamTimeISO } from './utils/dateUtils';

export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';
export const APP_NAME = 'LearnTwinChain';

export const DEFAULT_LEARNER_PROFILE: LearnerProfile = {
  did: 'did:learntwin:student001',
  name: 'Alex Student',
  email: 'alex.student@uit.edu.vn',
  avatarUrl: 'https://ui-avatars.com/api/?name=Alex+Student&background=0ea5e9&color=fff&size=100',
  institution: 'UIT',
  program: 'Computer Science',
  birth_year: 2000,
  enrollment_date: '2023-09-01',
  createdAt: '2023-09-01T00:00:00.000Z'
};

export const INITIAL_DIGITAL_TWIN: DigitalTwin = {
  learnerDid: DEFAULT_LEARNER_PROFILE.did,
  version: 1,
  knowledge: {
    "Python Introduction": 0.0,
    "Variables and Data Types": 0.0,
    "Control Flow - If Statements": 0.0,
    "Loops - For and While": 0.0,
    "Functions Basics": 0.0,
    "Lists and Dictionaries": 0.0,
    "Error Handling": 0.0,
    "File Handling": 0.0,
    "Blockchain Fundamentals": 0.0,
    "Smart Contracts": 0.0,
    "Web3 Development": 0.0
  },
  skills: {
    problemSolving: 0.7,
    logicalThinking: 0.8,
    selfLearning: 0.6
  },
  behavior: {
    timeSpent: "5h 30m",
    quizAccuracy: 0.75,
    lastLlmSession: getCurrentVietnamTimeISO(),
    preferredLearningStyle: "hands-on",
    mostAskedTopics: ["recursion", "loops"]
  },
  checkpoints: [],
  lastUpdated: getCurrentVietnamTimeISO()
};

export const LEARNING_MODULES: LearningModule[] = [
  // Python Series - Foundation
  {
    id: 'python_01',
    title: 'Python Introduction',
    description: 'Get started with Python programming basics, history, and development environment setup.',
    estimatedTime: '45 minutes',
    prerequisites: [],
    content: [
      { type: 'text', value: 'Welcome to Python! Python is a high-level, interpreted programming language known for its readability and versatility.' },
      { type: 'text', value: 'It was created by Guido van Rossum and first released in 1991. Python\'s design philosophy emphasizes code readability with its notable use of significant indentation.' },
      { type: 'code', value: '# This is a simple Python comment\nprint("Hello, Python!")', language: 'python' },
      { type: 'video', value: 'https://www.youtube.com/watch?v=kqtD5dpn9C8' },
    ],
    quiz: [
      { id: 'q1_py01', text: 'Who created Python?', options: [{ id: 'a', text: 'James Gosling' }, { id: 'b', text: 'Guido van Rossum' }, { id: 'c', text: 'Bjarne Stroustrup' }], correctOptionId: 'b', explanation: 'Guido van Rossum is the creator of Python.' },
      { id: 'q2_py01', text: 'When was Python first released?', options: [{ id: 'a', text: '1991' }, { id: 'b', text: '2000' }, { id: 'c', text: '1985' }], correctOptionId: 'a', explanation: 'Python was first released in 1991.' },
    ],
  },
  {
    id: 'python_02',
    title: 'Variables and Data Types',
    description: 'Learn about variables, data storage, and fundamental data types in Python.',
    estimatedTime: '1 hour',
    prerequisites: ['python_01'],
    content: [
      { type: 'text', value: 'Variables are containers for storing data values. Python has no command for declaring a variable. A variable is created the moment you first assign a value to it.' },
      { type: 'code', value: 'x = 5         # x is of type int\ny = "Hello"   # y is of type str\npi = 3.14     # pi is of type float\nis_learning = True # is_learning is of type bool', language: 'python' },
      { type: 'text', value: 'Common data types include integers (int), floating-point numbers (float), strings (str), and booleans (bool).' },
      { type: 'video', value: 'https://www.youtube.com/watch?v=HGOBQPFzWKo' },
    ],
    quiz: [
      { id: 'q1_py02', text: 'What is the data type of `x = 10`?', options: [{ id: 'a', text: 'str' }, { id: 'b', text: 'int' }, { id: 'c', text: 'float' }], correctOptionId: 'b' },
      { id: 'q2_py02', text: 'Which of these creates a string variable?', options: [{ id: 'a', text: 'name = John' }, { id: 'b', text: 'name = "John"' }, { id: 'c', text: 'name = 123' }], correctOptionId: 'b', explanation: 'Strings in Python are enclosed in quotes.' },
    ],
  },
  {
    id: 'python_03',
    title: 'Control Flow - If Statements',
    description: 'Master conditional statements and decision-making in Python programs.',
    estimatedTime: '1 hour',
    prerequisites: ['python_02'],
    content: [
      { type: 'text', value: 'Control flow statements allow you to execute certain blocks of code conditionally based on specific conditions.'},
      { type: 'code', value: 'age = 18\nif age >= 18:\n  print("You are an adult.")\nelif age >= 13:\n  print("You are a teenager.")\nelse:\n  print("You are a child.")', language: 'python' },
      { type: 'text', value: 'Use `if`, `elif`, and `else` to create branching logic in your programs.'},
      { type: 'video', value: 'https://www.youtube.com/watch?v=f4KOjWS_KZs' },
    ],
    quiz: [
      { id: 'q1_py03', text: 'Which keyword is used for conditional execution?', options: [{id: 'a', text: 'loop'}, {id: 'b', text: 'if'}, {id: 'c', text: 'for'}], correctOptionId: 'b'},
      { id: 'q2_py03', text: 'What does `elif` stand for?', options: [{id: 'a', text: 'else if'}, {id: 'b', text: 'end if'}, {id: 'c', text: 'exit if'}], correctOptionId: 'a', explanation: '`elif` is a combination of `else` and `if`.'},
    ],
  },
   {
    id: 'python_04',
    title: 'Loops - For and While',
    description: 'Learn to create repetitive code execution with for and while loops.',
    estimatedTime: '1.5 hours',
    prerequisites: ['python_03'],
    content: [
      { type: 'text', value: 'Loops allow you to execute a block of code multiple times. Python has two main types of loops: `for` and `while`.'},
      { type: 'code', value: '# For loop\nfruits = ["apple", "banana", "cherry"]\nfor fruit in fruits:\n  print(fruit)\n\n# While loop\ni = 1\nwhile i < 6:\n  print(i)\n  i += 1', language: 'python' },
      { type: 'text', value: '`for` loops are used for iterating over sequences. `while` loops repeat as long as a certain boolean condition is met.'},
      { type: 'video', value: 'https://www.youtube.com/watch?v=f4KOjWS_KZs' },
    ],
    quiz: [
      { id: 'q1_py04', text: 'What does a `for` loop typically iterate over?', options: [{id: 'a', text: 'A single variable'}, {id: 'b', text: 'A sequence of items'}, {id: 'c', text: 'A boolean condition'}], correctOptionId: 'b', explanation: '`for` loops are designed to iterate over sequences like lists, strings, etc.'},
      { id: 'q2_py04', text: 'What happens if a while loop condition is always True?', options: [{id: 'a', text: 'It runs once'}, {id: 'b', text: 'It runs infinitely'}, {id: 'c', text: 'It doesn\'t run'}], correctOptionId: 'b', explanation: 'A while loop with always True condition becomes an infinite loop.'},
    ],
  },
  {
    id: 'python_05',
    title: 'Functions Basics',
    description: 'Create reusable code blocks with functions and understand parameters and return values.',
    estimatedTime: '1.5 hours',
    prerequisites: ['python_04'],
    content: [
      { type: 'text', value: 'A function is a block of code which only runs when it is called. You can pass data, known as parameters, into a function. A function can return data as a result.'},
      { type: 'code', value: 'def greet(name):\n  """This function greets the person passed in as a parameter."""\n  return f"Hello, {name}!"\n\nmessage = greet("Alice")\nprint(message)', language: 'python' },
      { type: 'text', value: 'Functions help break down complex problems into smaller, manageable pieces and promote code reusability.'},
      { type: 'video', value: 'https://www.youtube.com/watch?v=9Os0o3wzS_I' },
    ],
    quiz: [
      { id: 'q1_py05', text: 'Which keyword is used to define a function in Python?', options: [{id: 'a', text: 'fun'}, {id: 'b', text: 'define'}, {id: 'c', text: 'def'}], correctOptionId: 'c'},
      { id: 'q2_py05', text: 'What is the primary purpose of functions?', options: [{id: 'a', text: 'To store data'}, {id: 'b', text: 'To make code reusable and organized'}, {id: 'c', text: 'To print output to the console'}], correctOptionId: 'b'},
    ],
  },
  {
    id: 'python_06',
    title: 'Lists and Dictionaries',
    description: 'Master Python\'s most important data structures for storing and organizing data.',
    estimatedTime: '1.5 hours',
    prerequisites: ['python_05'],
    content: [
      { type: 'text', value: 'Lists and dictionaries are Python\'s most commonly used data structures for storing collections of data.'},
      { type: 'code', value: '# Lists - ordered, changeable collections\nfruits = ["apple", "banana", "cherry"]\nfruits.append("orange")\n\n# Dictionaries - key-value pairs\nperson = {\n  "name": "John",\n  "age": 30,\n  "city": "New York"\n}', language: 'python' },
      { type: 'text', value: 'Lists are ordered and changeable. Dictionaries store data as key-value pairs and are unordered but changeable.'},
      { type: 'video', value: 'https://www.youtube.com/watch?v=W8KRzm-HUcc' },
    ],
    quiz: [
      { id: 'q1_py06', text: 'How do you add an item to a list?', options: [{id: 'a', text: 'list.add()'}, {id: 'b', text: 'list.append()'}, {id: 'c', text: 'list.insert()'}], correctOptionId: 'b'},
      { id: 'q2_py06', text: 'What is the correct syntax for creating a dictionary?', options: [{id: 'a', text: 'dict = [key: value]'}, {id: 'b', text: 'dict = {key: value}'}, {id: 'c', text: 'dict = (key: value)'}], correctOptionId: 'b'},
    ],
  },
  {
    id: 'python_07',
    title: 'Error Handling',
    description: 'Learn to handle exceptions and errors gracefully in your Python programs.',
    estimatedTime: '1 hour',
    prerequisites: ['python_06'],
    content: [
      { type: 'text', value: 'Error handling allows your program to continue running even when errors occur, making it more robust and user-friendly.'},
      { type: 'code', value: 'try:\n  number = int(input("Enter a number: "))\n  result = 10 / number\n  print(f"Result: {result}")\nexcept ValueError:\n  print("Please enter a valid number")\nexcept ZeroDivisionError:\n  print("Cannot divide by zero")', language: 'python' },
      { type: 'text', value: 'Use `try`, `except`, and optionally `finally` to handle different types of exceptions.'},
      { type: 'video', value: 'https://www.youtube.com/watch?v=NIWwJbo-9_8' },
    ],
    quiz: [
      { id: 'q1_py07', text: 'Which keyword is used to handle exceptions?', options: [{id: 'a', text: 'try'}, {id: 'b', text: 'catch'}, {id: 'c', text: 'handle'}], correctOptionId: 'a'},
      { id: 'q2_py07', text: 'What happens if an exception is not caught?', options: [{id: 'a', text: 'The program continues'}, {id: 'b', text: 'The program crashes'}, {id: 'c', text: 'Nothing'}], correctOptionId: 'b'},
    ],
  },
  {
    id: 'python_08',
    title: 'File Handling',
    description: 'Learn to read from and write to files in Python for data persistence.',
    estimatedTime: '1 hour',
    prerequisites: ['python_07'],
    content: [
      { type: 'text', value: 'File handling allows your programs to read data from files and write data to files for permanent storage.'},
      { type: 'code', value: '# Reading from a file\nwith open("data.txt", "r") as file:\n  content = file.read()\n  print(content)\n\n# Writing to a file\nwith open("output.txt", "w") as file:\n  file.write("Hello, World!")', language: 'python' },
      { type: 'text', value: 'Always use the `with` statement when working with files to ensure they are properly closed.'},
      { type: 'video', value: 'https://www.youtube.com/watch?v=Uh2ebFW8OYM' },
    ],
    quiz: [
      { id: 'q1_py08', text: 'What mode opens a file for reading?', options: [{id: 'a', text: '"w"'}, {id: 'b', text: '"r"'}, {id: 'c', text: '"a"'}], correctOptionId: 'b'},
      { id: 'q2_py08', text: 'Why should you use the `with` statement?', options: [{id: 'a', text: 'It\'s faster'}, {id: 'b', text: 'It automatically closes the file'}, {id: 'c', text: 'It\'s required'}], correctOptionId: 'b'},
    ],
  },

  // Blockchain Series
  {
    id: 'blockchain_01',
    title: 'Blockchain Fundamentals',
    description: 'Understand the core concepts of blockchain technology, decentralization, and distributed ledgers.',
    estimatedTime: '1.5 hours',
    prerequisites: ['python_08'],
    content: [
      { type: 'text', value: 'Blockchain is a distributed ledger technology that enables trustless systems through decentralization and cryptographic security.' },
      { type: 'text', value: 'Key concepts include blocks, chains, consensus mechanisms, and the role of cryptography in maintaining security.' },
      { type: 'video', value: 'https://www.youtube.com/watch?v=SSo_EIwHSd4' },
      { type: 'text', value: 'Bitcoin and Ethereum are two major blockchains with different designs and purposes.' }
    ],
    quiz: [
      { id: 'q1_bc01', text: 'What is stored in a blockchain block?', options: [{id:'a', text:'Images'}, {id:'b', text:'Transactions/records'}, {id:'c', text:'Videos'}], correctOptionId: 'b' },
      { id: 'q2_bc01', text: 'What does consensus ensure?', options: [{id:'a', text:'Faster UI'}, {id:'b', text:'Network agreement on the ledger state'}, {id:'c', text:'Lower gas fees'}], correctOptionId: 'b' }
    ]
  },
  {
    id: 'blockchain_02',
    title: 'Smart Contracts',
    description: 'Learn about smart contracts, their execution on blockchain, and basic Solidity programming.',
    estimatedTime: '2 hours',
    prerequisites: ['blockchain_01'],
    content: [
      { type: 'text', value: 'Smart contracts are self-executing programs stored on the blockchain that automatically execute when predetermined conditions are met.' },
      { type: 'text', value: 'They run on the Ethereum Virtual Machine (EVM) and are written in languages like Solidity.' },
      { type: 'video', value: 'https://www.youtube.com/watch?v=ipwxYa-F1uY' },
      { type: 'code', value: '// Basic Solidity contract\ncontract HelloWorld {\n    function sayHello() public pure returns (string memory) {\n        return "Hello, World!";\n    }\n}', language: 'solidity' }
    ],
    quiz: [
      { id: 'q1_bc02', text: 'Smart contracts run on which layer of Ethereum?', options: [{id:'a', text:'Application layer off-chain'}, {id:'b', text:'EVM on-chain'}, {id:'c', text:'Database server'}], correctOptionId: 'b' },
      { id: 'q2_bc02', text: 'What language is primarily used for Ethereum smart contracts?', options: [{id:'a', text:'JavaScript'}, {id:'b', text:'Solidity'}, {id:'c', text:'Python'}], correctOptionId: 'b' }
    ]
  },
  {
    id: 'blockchain_03',
    title: 'Web3 Development',
    description: 'Learn to interact with blockchain networks using Web3 libraries and build decentralized applications.',
    estimatedTime: '2 hours',
    prerequisites: ['blockchain_02'],
    content: [
      { type: 'text', value: 'Web3 development involves creating applications that interact with blockchain networks using libraries like Web3.js or ethers.js.' },
      { type: 'code', value: '// Basic Web3 interaction\nconst Web3 = require("web3");\nconst web3 = new Web3("https://mainnet.infura.io/v3/YOUR-PROJECT-ID");\n\n// Get account balance\nconst balance = await web3.eth.getBalance("0x...");', language: 'javascript' },
      { type: 'text', value: 'DApps (Decentralized Applications) combine traditional web technologies with blockchain functionality.' },
      { type: 'video', value: 'https://www.youtube.com/watch?v=1KP_hL0Wbyg' }
    ],
    quiz: [
      { id: 'q1_bc03', text: 'What does Web3.js allow developers to do?', options: [{id:'a', text:'Create websites'}, {id:'b', text:'Interact with Ethereum blockchain'}, {id:'c', text:'Write smart contracts'}], correctOptionId: 'b' },
      { id: 'q2_bc03', text: 'What is a DApp?', options: [{id:'a', text:'A database application'}, {id:'b', text:'A decentralized application'}, {id:'c', text:'A web application'}], correctOptionId: 'b' }
    ]
  }
];
