import { LearningModule, LearnerProfile, DigitalTwin } from './types';
import { getCurrentVietnamTimeISO } from './utils/dateUtils';

export const GEMINI_MODEL_NAME = 'gemini-2.0-flash';
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
    "Python cơ bản": 0.8,
    "Data Structures": 0.6
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
  {
    id: 'module1',
    title: 'Introduction to Python',
    description: 'Get started with the basics of Python programming, its history, and why it\'s popular.',
    estimatedTime: '1 hour',
    content: [
      { type: 'text', value: 'Welcome to the world of Python! Python is a high-level, interpreted programming language known for its readability and versatility.' },
      { type: 'text', value: 'It was created by Guido van Rossum and first released in 1991. Python\'s design philosophy emphasizes code readability with its notable use of significant indentation.' },
      { type: 'code', value: '# This is a simple Python comment\nprint("Hello, Python!")', language: 'python' },
      { type: 'image', value: 'https://via.placeholder.com/600x300/0ea5e9/ffffff?text=Python+Introduction' },
    ],
    quiz: [
      { id: 'q1m1', text: 'Who created Python?', options: [{ id: 'a', text: 'James Gosling' }, { id: 'b', text: 'Guido van Rossum' }, { id: 'c', text: 'Bjarne Stroustrup' }], correctOptionId: 'b', explanation: 'Guido van Rossum is the creator of Python.' },
      { id: 'q2m1', text: 'When was Python first released?', options: [{ id: 'a', text: '1991' }, { id: 'b', text: '2000' }, { id: 'c', text: '1985' }], correctOptionId: 'a', explanation: 'Python was first released in 1991.' },
    ],
  },
  {
    id: 'module2',
    title: 'Variables and Data Types',
    description: 'Learn about variables, how to store data, and the different data types in Python.',
    estimatedTime: '1.5 hours',
    content: [
      { type: 'text', value: 'Variables are containers for storing data values. Python has no command for declaring a variable. A variable is created the moment you first assign a value to it.' },
      { type: 'code', value: 'x = 5         # x is of type int\ny = "Hello"   # y is of type str\npi = 3.14     # pi is of type float\nis_learning = True # is_learning is of type bool', language: 'python' },
      { type: 'text', value: 'Common data types include integers (int), floating-point numbers (float), strings (str), and booleans (bool).' },
    ],
    quiz: [
      { id: 'q1m2', text: 'What is the data type of `x = 10`?', options: [{ id: 'a', text: 'str' }, { id: 'b', text: 'int' }, { id: 'c', text: 'float' }], correctOptionId: 'b' },
      { id: 'q2m2', text: 'Which of these creates a string variable?', options: [{ id: 'a', text: 'name = John' }, { id: 'b', text: 'name = "John"' }, { id: 'c', text: 'name = 123' }], correctOptionId: 'b', explanation: 'Strings in Python are enclosed in quotes.' },
    ],
  },
   {
    id: 'module3',
    title: 'Control Flow (If/Else, Loops)',
    description: 'Understand how to control the flow of your Python programs using conditional statements and loops.',
    estimatedTime: '2 hours',
    content: [
      { type: 'text', value: 'Control flow statements allow you to execute certain blocks of code conditionally or repeatedly.'},
      { type: 'code', value: 'age = 18\nif age >= 18:\n  print("You are an adult.")\nelse:\n  print("You are a minor.")', language: 'python' },
      { type: 'text', value: '`for` loops are used for iterating over a sequence (like a list, tuple, dictionary, set, or string). `while` loops repeat as long as a certain boolean condition is met.'},
      { type: 'code', value: '# For loop\nfruits = ["apple", "banana", "cherry"]\nfor fruit in fruits:\n  print(fruit)\n\n# While loop\ni = 1\nwhile i < 6:\n  print(i)\n  i += 1', language: 'python' },
    ],
    quiz: [
      { id: 'q1m3', text: 'Which keyword is used for conditional execution?', options: [{id: 'a', text: 'loop'}, {id: 'b', text: 'if'}, {id: 'c', text: 'for'}], correctOptionId: 'b'},
      { id: 'q2m3', text: 'What does a `for` loop typically iterate over?', options: [{id: 'a', text: 'A single variable'}, {id: 'b', text: 'A sequence of items'}, {id: 'c', text: 'A boolean condition'}], correctOptionId: 'b', explanation: '`for` loops are designed to iterate over sequences like lists, strings, etc.'},
    ],
  },
  {
    id: 'module4',
    title: 'Functions',
    description: 'Learn to define and use functions to make your code reusable and organized.',
    estimatedTime: '1.5 hours',
    content: [
      { type: 'text', value: 'A function is a block of code which only runs when it is called. You can pass data, known as parameters, into a function. A function can return data as a result.'},
      { type: 'code', value: 'def greet(name):\n  """This function greets the person passed in as a parameter."""\n  print(f"Hello, {name}!")\n\ngreet("Alice") # Calling the function', language: 'python' },
      { type: 'text', value: 'Functions help break down complex problems into smaller, manageable pieces.'},
    ],
    quiz: [
      { id: 'q1m4', text: 'Which keyword is used to define a function in Python?', options: [{id: 'a', text: 'fun'}, {id: 'b', text: 'define'}, {id: 'c', text: 'def'}], correctOptionId: 'c'},
      { id: 'q2m4', text: 'What is the primary purpose of functions?', options: [{id: 'a', text: 'To store data'}, {id: 'b', text: 'To make code reusable and organized'}, {id: 'c', text: 'To print output to the console'}], correctOptionId: 'b'},
    ],
  }
];
