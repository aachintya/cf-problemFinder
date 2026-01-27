# Codeforces Problem Finder

The Codeforces Problem Finder is a web application built using React that allows users to find problems solved by Codeforces users based on their ratings.

<p align="center">
  <img src="public/logo512.png" alt="Codeforces Problem Finder" style="width: 200px; height: 200px;">
</p>

## Usage

1. Visit the application [here](https://cf-problem.vercel.app/).

2. Enter the Target (Included) and Practice (Excluded) Codeforces usernames.

3. Click the "Find Problems" button.

4. The app will find problems solved by any of the target users that haven't been solved by any of the practice users, grouped by rating.

## Features

- **Multi-User Comparison:** Compare multiple handles simultaneously.
- **Aggregate Logic:** Find the union of solved problems minus the union of excluded problems.
- **Loading Indicators:** Real-time feedback while fetching data.
- **Clean UI:** Badge-based handle management and responsive design.

## Tech Stack

- React
- Codeforces API
- Bootstrap

## Deployment

The Codeforces Problem Finder is deployed and accessible online:

- [Live Demo](https://cf-problem.vercel.app/)

## Contributors

- [Parth Johri](https://www.linkedin.com/in/parthjohri07)
- [Aachintya](https://github.com/aachintya)

## License

This project is open-source and available under the [MIT License](LICENSE).
