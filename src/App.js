import React, { useState } from "react";
import UserInput from "./components/UserInput";
import ProblemTable from "./components/ProblemTable";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

function App() {
  const [problems, setProblems] = useState([]);
  const [username, setUsername] = useState([]);
  const [practicer, setPracticer] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUsernameSubmit = (includeHandles, excludeHandles) => {
    setProblems([]);
    setUsername(includeHandles);
    setPracticer(excludeHandles);
    setLoading(true);

    // Fetch Status for all Include Handles
    const includeStatusPromises = includeHandles.map((handle) =>
      fetch(`https://codeforces.com/api/user.status?handle=${handle}`).then(
        (res) => res.json()
      )
    );

    // Fetch Status for all Exclude Handles
    const excludeStatusPromises = excludeHandles.map((handle) =>
      fetch(`https://codeforces.com/api/user.status?handle=${handle}`).then(
        (res) => res.json()
      )
    );

    // Fetch Info for the first Include handle (to keep the "Name" feature)
    if (includeHandles.length === 1) {
      fetch(`https://codeforces.com/api/user.info?handles=${includeHandles[0]}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "OK") {
            const user = data.result[0];
            setFirstName(user.firstName);
            setLastName(user.lastName);
          }
        });
    } else {
      setFirstName("");
      setLastName("");
    }

    Promise.all([
      Promise.all(includeStatusPromises),
      Promise.all(excludeStatusPromises),
    ])
      .then(([includeResults, excludeResults]) => {
        const allIncludeOk = includeResults.every((r) => r.status === "OK");
        const allExcludeOk = excludeResults.every((r) => r.status === "OK");

        if (allIncludeOk && allExcludeOk) {
          // Aggregate problems solved by ANY Target user (Union)
          const includeSolvedMap = new Map();
          includeResults.forEach((res) => {
            const processed = processData(res.result);
            processed.forEach((p) => {
              if (!includeSolvedMap.has(p.problemId)) {
                includeSolvedMap.set(p.problemId, p);
              }
            });
          });

          // Aggregate problem IDs solved by ANY Practicer user (Union)
          const excludeSolvedIds = new Set();
          excludeResults.forEach((res) => {
            const processed = processData(res.result);
            processed.forEach((p) => {
              excludeSolvedIds.add(p.problemId);
            });
          });

          // Find problems solved by Target Union but NOT by Practicer Union
          const difference = Array.from(includeSolvedMap.values()).filter(
            (p) => !excludeSolvedIds.has(p.problemId)
          );

          setProblems(difference);
        } else {
          const errorHandles = [
            ...includeResults.filter((r) => r.status !== "OK"),
            ...excludeResults.filter((r) => r.status !== "OK"),
          ].map((r) => r.comment || "Unknown Handle");
          alert(
            "Error fetching data for one or more users: " +
            errorHandles.join(", ")
          );
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const processData = (resultArr) => {
    const processedProblems = resultArr
      .filter((sub) => sub.verdict === "OK")
      .map((sub) => ({
        problemId: `${sub.problem.contestId}/${sub.problem.index}`,
        rating: sub.problem.rating || "Unrated",
        name: sub.problem.name,
      }));

    const uniqueProblemIds = new Set();
    const uniqueProcessedProblems = processedProblems.filter((problem) => {
      if (!uniqueProblemIds.has(problem.problemId)) {
        uniqueProblemIds.add(problem.problemId);
        return true;
      }
      return false;
    });

    return uniqueProcessedProblems;
  };

  return (
    <div className="container-fluid container">
      <div className="row">
        <div className="col-md-12 text-center">
          <h1>Codeforces Problem Finder</h1>
        </div>
      </div>
      <div className="row container">
        <div className="col-md-15">
          <UserInput
            onUsernameSubmit={handleUsernameSubmit}
            loading={loading}
          />
          {loading && (
            <div className="spinner-container">
              <div className="loading-spinner"></div>
            </div>
          )}
          {!loading && username.length > 0 && (
            <div className="text-center mt-4">
              <h4>
                Problems solved by{" "}
                <span className="text-primary">{username.join(" + ")}</span>
                {practicer.length > 0 && (
                  <>
                    {" "}
                    but NOT by{" "}
                    <span className="text-danger">{practicer.join(" + ")}</span>
                  </>
                )}
              </h4>
              {username.length === 1 && (firstName || lastName) && (
                <p className="text-muted">
                  Target: {firstName} {lastName}
                </p>
              )}
            </div>
          )}
          {problems.length > 0 && <ProblemTable problems={problems} />}
        </div>
      </div>
      <footer className="mt-4 text-center">
        <a
          href="https://github.com/aachintya/cf-problemFinder"
          target="_blank"
          rel="noopener noreferrer"
          className="a-style"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}

export default App;
