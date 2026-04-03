export interface Question {
  value: number
  question: string
  answer: string
  isDailyDouble?: boolean
  imageUrl?: string
}

export interface Category {
  category: string
  questions: Question[]
}

export interface FinalJeopardy {
  category: string
  question: string
  answer: string
  imageUrl?: string
}

export const gameData: Category[] = [
  {
    category: "History",
    questions: [
      {
        value: 100,
        question: "This document, signed in 1776, declared the United States independent from Great Britain.",
        answer: "What is the Declaration of Independence?",
      },
      {
        value: 200,
        question: "This ancient wonder was a lighthouse built by the Ptolemaic Kingdom in Egypt.",
        answer: "What is the Lighthouse of Alexandria?",
      },
      {
        value: 300,
        question: "This Roman emperor built a wall across northern Britain to defend against Scottish tribes.",
        answer: "Who is Hadrian?",
      },
      {
        value: 400,
        question: "This 1803 purchase from France doubled the size of the United States.",
        answer: "What is the Louisiana Purchase?",
        isDailyDouble: true,
      },
      {
        value: 500,
        question: "This treaty ended World War I in 1919.",
        answer: "What is the Treaty of Versailles?",
      },
    ],
  },
  {
    category: "Science",
    questions: [
      {
        value: 100,
        question: "This element with symbol 'O' is essential for human respiration.",
        answer: "What is Oxygen?",
      },
      {
        value: 200,
        question: "This is the closest planet to the Sun in our solar system.",
        answer: "What is Mercury?",
      },
      {
        value: 300,
        question: "This scientist formulated the theory of general relativity.",
        answer: "Who is Albert Einstein?",
      },
      {
        value: 400,
        question: "This subatomic particle has a negative charge.",
        answer: "What is an electron?",
      },
      {
        value: 500,
        question: "This process converts sugar into energy in cells without using oxygen.",
        answer: "What is fermentation?",
        isDailyDouble: true,
      },
    ],
  },
  {
    category: "Geography",
    questions: [
      {
        value: 100,
        question: "This is the largest ocean on Earth.",
        answer: "What is the Pacific Ocean?",
      },
      {
        value: 200,
        question: "This African country is known as the 'Land of a Thousand Hills'.",
        answer: "What is Rwanda?",
      },
      {
        value: 300,
        question: "This mountain range separates Europe from Asia.",
        answer: "What are the Ural Mountains?",
      },
      {
        value: 400,
        question: "This South American country is home to the driest place on Earth, the Atacama Desert.",
        answer: "What is Chile?",
      },
      {
        value: 500,
        question: "This strait connects the Mediterranean Sea to the Atlantic Ocean.",
        answer: "What is the Strait of Gibraltar?",
      },
    ],
  },
  {
    category: "Literature",
    questions: [
      {
        value: 100,
        question: "This author wrote 'Romeo and Juliet'.",
        answer: "Who is William Shakespeare?",
      },
      {
        value: 200,
        question: "This novel by Harper Lee features the character Atticus Finch.",
        answer: "What is 'To Kill a Mockingbird'?",
      },
      {
        value: 300,
        question: "This dystopian novel by George Orwell introduced the concept of 'Big Brother'.",
        answer: "What is '1984'?",
        isDailyDouble: true,
      },
      {
        value: 400,
        question: "This epic poem by Homer tells the story of Odysseus's journey home after the Trojan War.",
        answer: "What is 'The Odyssey'?",
      },
      {
        value: 500,
        question: "This Russian author wrote 'Crime and Punishment' and 'The Brothers Karamazov'.",
        answer: "Who is Fyodor Dostoevsky?",
      },
    ],
  },
  {
    category: "Movies",
    questions: [
      {
        value: 100,
        question: "This 1939 film features the line 'There's no place like home.'",
        answer: "What is 'The Wizard of Oz'?",
      },
      {
        value: 200,
        question: "This actor played Iron Man in the Marvel Cinematic Universe.",
        answer: "Who is Robert Downey Jr.?",
      },
      {
        value: 300,
        question: "This director is known for films like 'Pulp Fiction' and 'Django Unchained'.",
        answer: "Who is Quentin Tarantino?",
      },
      {
        value: 400,
        question: "This 1972 film about the Corleone family won the Academy Award for Best Picture.",
        answer: "What is 'The Godfather'?",
      },
      {
        value: 500,
        question: "This Japanese animated film directed by Hayao Miyazaki won an Oscar in 2003.",
        answer: "What is 'Spirited Away'?",
      },
    ],
  },
  ]

export const finalJeopardyData: FinalJeopardy = {
  category: "World Geography",
  question: "This country has the most natural lakes in the world, with over 3 million.",
  answer: "What is Canada?",
}
