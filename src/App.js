import React, { useState } from "react";
import UserInput from "./components/UserInput";
import RevisionMode from "./components/RevisionMode";
import ProblemTable from "./components/ProblemTable";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

function App() {
  const [mode, setMode] = useState("finder"); // "finder" or "revision"
  const [problems, setProblems] = useState([]);
  const [username, setUsername] = useState([]);
  const [practicer, setPracticer] = useState([]);
  const [revisionUser, setRevisionUser] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("recent"); // "recent", "rating", "contestId", "alphabetical"
  const [allTags, setAllTags] = useState([]); // All unique tags from problems
  const [selectedTags, setSelectedTags] = useState([]); // Selected tags for filtering
  const [tagFilterMode, setTagFilterMode] = useState("any"); // "any" or "all"
  const [groupBy, setGroupBy] = useState("rating"); // "rating" or "tag"

  const handleUsernameSubmit = (includeHandles, excludeHandles) => {
    setProblems([]);
    setUsername(includeHandles);
    setPracticer(excludeHandles);
    setLoading(true);

    const includeStatusPromises = includeHandles.map((handle) =>
      fetch(`https://codeforces.com/api/user.status?handle=${handle}`).then(
        (res) => res.json()
      )
    );

    const excludeStatusPromises = excludeHandles.map((handle) =>
      fetch(`https://codeforces.com/api/user.status?handle=${handle}`).then(
        (res) => res.json()
      )
    );

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
          const includeSolvedMap = new Map();
          includeResults.forEach((res) => {
            const processed = processData(res.result);
            processed.forEach((p) => {
              if (!includeSolvedMap.has(p.problemId)) {
                includeSolvedMap.set(p.problemId, p);
              }
            });
          });

          const excludeSolvedIds = new Set();
          excludeResults.forEach((res) => {
            const processed = processData(res.result);
            processed.forEach((p) => {
              excludeSolvedIds.add(p.problemId);
            });
          });

          const difference = Array.from(includeSolvedMap.values()).filter(
            (p) => !excludeSolvedIds.has(p.problemId)
          );

          // Extract all unique tags
          const tagsSet = new Set();
          difference.forEach((p) => p.tags.forEach((t) => tagsSet.add(t)));
          setAllTags(Array.from(tagsSet).sort());
          setSelectedTags([]);

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

  const handleRevisionSubmit = (handle, minRating, maxRating) => {
    setProblems([]);
    setRevisionUser(handle);
    setLoading(true);

    fetch(`https://codeforces.com/api/user.status?handle=${handle}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "OK") {
          const now = Date.now();
          const processedProblems = data.result
            .filter((sub) => sub.verdict === "OK")
            .map((sub) => ({
              problemId: `${sub.problem.contestId}/${sub.problem.index}`,
              rating: sub.problem.rating || "Unrated",
              name: sub.problem.name,
              tags: sub.problem.tags || [],
              solveTime: sub.creationTimeSeconds * 1000,
              daysSinceSolve: Math.floor(
                (now - sub.creationTimeSeconds * 1000) / (1000 * 60 * 60 * 24)
              ),
            }));

          // Keep only the latest (most recent) solve for each problem
          const problemMap = new Map();
          processedProblems.forEach((p) => {
            const existing = problemMap.get(p.problemId);
            if (!existing || p.solveTime > existing.solveTime) {
              problemMap.set(p.problemId, p);
            }
          });

          // Convert to array and apply rating filter
          let uniqueProblems = Array.from(problemMap.values());

          if (minRating !== null) {
            uniqueProblems = uniqueProblems.filter(
              (p) => p.rating !== "Unrated" && p.rating >= minRating
            );
          }
          if (maxRating !== null) {
            uniqueProblems = uniqueProblems.filter(
              (p) => p.rating !== "Unrated" && p.rating <= maxRating
            );
          }

          // Sort by days since solve (descending - oldest first)
          uniqueProblems.sort((a, b) => b.daysSinceSolve - a.daysSinceSolve);

          // Extract all unique tags
          const tagsSet = new Set();
          uniqueProblems.forEach((p) => p.tags.forEach((t) => tagsSet.add(t)));
          setAllTags(Array.from(tagsSet).sort());
          setSelectedTags([]);

          setProblems(uniqueProblems);
        } else {
          alert("Error fetching user data: " + (data.comment || "Unknown"));
        }
      })
      .catch((err) => {
        alert("Network error: " + err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const processData = (resultArr) => {
    const now = Date.now();
    const processedProblems = resultArr
      .filter((sub) => sub.verdict === "OK")
      .map((sub) => ({
        problemId: `${sub.problem.contestId}/${sub.problem.index}`,
        contestId: sub.problem.contestId,
        rating: sub.problem.rating || "Unrated",
        name: sub.problem.name,
        tags: sub.problem.tags || [],
        solveTime: sub.creationTimeSeconds * 1000,
        daysSinceSolve: Math.floor(
          (now - sub.creationTimeSeconds * 1000) / (1000 * 60 * 60 * 24)
        ),
      }));

    // Keep only the most recent solve for each problem
    const problemMap = new Map();
    processedProblems.forEach((problem) => {
      const existing = problemMap.get(problem.problemId);
      if (!existing || problem.solveTime > existing.solveTime) {
        problemMap.set(problem.problemId, problem);
      }
    });

    return Array.from(problemMap.values());
  };

  const handleTagToggle = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const getFilteredProblems = (problemList) => {
    if (selectedTags.length === 0) {
      return problemList;
    }

    return problemList.filter((problem) => {
      if (tagFilterMode === "any") {
        return selectedTags.some((tag) => problem.tags.includes(tag));
      } else {
        return selectedTags.every((tag) => problem.tags.includes(tag));
      }
    });
  };

  const getSortedProblems = (problemList) => {
    if (mode === "revision") {
      return problemList; // Revision mode has its own sorting
    }

    const sorted = [...problemList];
    switch (sortBy) {
      case "recent":
        sorted.sort((a, b) => b.solveTime - a.solveTime);
        break;
      case "oldest":
        sorted.sort((a, b) => a.solveTime - b.solveTime);
        break;
      case "contestId":
        sorted.sort((a, b) => b.contestId - a.contestId);
        break;
      case "contestIdAsc":
        sorted.sort((a, b) => a.contestId - b.contestId);
        break;
      case "alphabetical":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "alphabeticalDesc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }
    return sorted;
  };

  const filteredProblems = getFilteredProblems(problems);

  return (
    <div className="container-fluid container">
      <div className="row">
        <div className="col-md-12 text-center">
          <h1>Codeforces Problem Finder</h1>
          <div className="btn-group mb-4" role="group">
            <button
              type="button"
              className={`btn ${mode === "finder" ? "btn-primary" : "btn-outline-primary"
                }`}
              onClick={() => {
                setMode("finder");
                setProblems([]);
              }}
            >
              Problem Finder
            </button>
            <button
              type="button"
              className={`btn ${mode === "revision" ? "btn-success" : "btn-outline-success"
                }`}
              onClick={() => {
                setMode("revision");
                setProblems([]);
              }}
            >
              Revision Mode
            </button>
          </div>
        </div>
      </div>
      <div className="row container">
        <div className="col-md-15">
          {mode === "finder" && (
            <UserInput
              onUsernameSubmit={handleUsernameSubmit}
              loading={loading}
            />
          )}
          {mode === "revision" && (
            <RevisionMode
              onRevisionSubmit={handleRevisionSubmit}
              loading={loading}
            />
          )}
          {loading && (
            <div className="spinner-container">
              <div className="loading-spinner"></div>
            </div>
          )}
          {!loading && mode === "finder" && username.length > 0 && (
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
              {problems.length > 0 && (
                <div className="sort-controls mt-3">
                  <div className="d-flex flex-wrap justify-content-center gap-2 align-items-center">
                    <span className="text-muted me-2">Sort:</span>
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        type="button"
                        className={`btn ${sortBy === "recent" ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setSortBy("recent")}
                      >
                        Newest ↓
                      </button>
                      <button
                        type="button"
                        className={`btn ${sortBy === "oldest" ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setSortBy("oldest")}
                      >
                        Oldest ↑
                      </button>
                    </div>
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        type="button"
                        className={`btn ${sortBy === "alphabetical" ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setSortBy("alphabetical")}
                      >
                        A-Z
                      </button>
                      <button
                        type="button"
                        className={`btn ${sortBy === "alphabeticalDesc" ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setSortBy("alphabeticalDesc")}
                      >
                        Z-A
                      </button>
                    </div>
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        type="button"
                        className={`btn ${sortBy === "contestId" ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setSortBy("contestId")}
                      >
                        Contest ↓
                      </button>
                      <button
                        type="button"
                        className={`btn ${sortBy === "contestIdAsc" ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setSortBy("contestIdAsc")}
                      >
                        Contest ↑
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Tag Filter Controls */}
              {allTags.length > 0 && (
                <div className="tag-filter-controls mt-3">
                  <div className="d-flex flex-wrap justify-content-center gap-2 align-items-center mb-2">
                    <span className="text-muted me-2">Filter Mode:</span>
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        type="button"
                        className={`btn ${tagFilterMode === "any" ? "btn-info" : "btn-outline-secondary"}`}
                        onClick={() => setTagFilterMode("any")}
                      >
                        Any Tag
                      </button>
                      <button
                        type="button"
                        className={`btn ${tagFilterMode === "all" ? "btn-info" : "btn-outline-secondary"}`}
                        onClick={() => setTagFilterMode("all")}
                      >
                        All Tags
                      </button>
                    </div>
                    <span className="text-muted ms-3 me-2">Group By:</span>
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        type="button"
                        className={`btn ${groupBy === "rating" ? "btn-warning" : "btn-outline-secondary"}`}
                        onClick={() => setGroupBy("rating")}
                      >
                        Rating
                      </button>
                      <button
                        type="button"
                        className={`btn ${groupBy === "tag" ? "btn-warning" : "btn-outline-secondary"}`}
                        onClick={() => setGroupBy("tag")}
                      >
                        Topic
                      </button>
                    </div>
                    {selectedTags.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger ms-2"
                        onClick={() => setSelectedTags([])}
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                  <div className="tag-badges d-flex flex-wrap justify-content-center gap-1 mt-2">
                    {allTags.map((tag) => (
                      <span
                        key={tag}
                        className={`badge tag-badge ${selectedTags.includes(tag) ? "bg-primary" : "bg-secondary"}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleTagToggle(tag)}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {selectedTags.length > 0 && (
                    <p className="text-muted mt-2 small">
                      Showing {filteredProblems.length} of {problems.length} problems
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          {!loading && mode === "revision" && revisionUser && (
            <div className="text-center mt-4">
              <h4>
                Revision for{" "}
                <span className="text-success">{revisionUser}</span>
              </h4>
              <p className="text-muted">
                {filteredProblems.length} problems to revise (oldest solves first)
              </p>
              {/* Tag Filter Controls for Revision Mode */}
              {allTags.length > 0 && (
                <div className="tag-filter-controls mt-3">
                  <div className="d-flex flex-wrap justify-content-center gap-2 align-items-center mb-2">
                    <span className="text-muted me-2">Filter Mode:</span>
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        type="button"
                        className={`btn ${tagFilterMode === "any" ? "btn-info" : "btn-outline-secondary"}`}
                        onClick={() => setTagFilterMode("any")}
                      >
                        Any Tag
                      </button>
                      <button
                        type="button"
                        className={`btn ${tagFilterMode === "all" ? "btn-info" : "btn-outline-secondary"}`}
                        onClick={() => setTagFilterMode("all")}
                      >
                        All Tags
                      </button>
                    </div>
                    <span className="text-muted ms-3 me-2">Group By:</span>
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        type="button"
                        className={`btn ${groupBy === "rating" ? "btn-warning" : "btn-outline-secondary"}`}
                        onClick={() => setGroupBy("rating")}
                      >
                        Rating
                      </button>
                      <button
                        type="button"
                        className={`btn ${groupBy === "tag" ? "btn-warning" : "btn-outline-secondary"}`}
                        onClick={() => setGroupBy("tag")}
                      >
                        Topic
                      </button>
                    </div>
                    {selectedTags.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger ms-2"
                        onClick={() => setSelectedTags([])}
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                  <div className="tag-badges d-flex flex-wrap justify-content-center gap-1 mt-2">
                    {allTags.map((tag) => (
                      <span
                        key={tag}
                        className={`badge tag-badge ${selectedTags.includes(tag) ? "bg-primary" : "bg-secondary"}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleTagToggle(tag)}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {selectedTags.length > 0 && (
                    <p className="text-muted mt-2 small">
                      Showing {filteredProblems.length} of {problems.length} problems
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          {filteredProblems.length > 0 && (
            <ProblemTable
              key={`${mode}-${sortBy}-${groupBy}-${filteredProblems.length}-${filteredProblems[0]?.problemId || ''}-${selectedTags.join(',')}`}
              problems={getSortedProblems(filteredProblems)}
              showDaysSinceSolve={mode === "revision"}
              groupBy={groupBy}
            />
          )}
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
