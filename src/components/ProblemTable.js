import React, { useState } from "react";
import "./ProblemTable.css";

function ProblemTable({ problems, showDaysSinceSolve = false, groupBy = "rating" }) {
  const groupedProblems = {};

  if (groupBy === "rating") {
    problems.forEach(({ problemId, rating, name, tags, daysSinceSolve }) => {
      if (!groupedProblems[rating]) {
        groupedProblems[rating] = [];
      }
      groupedProblems[rating].push({ problemId, name, tags, daysSinceSolve });
    });
  } else {
    // Group by tag - each problem can appear in multiple groups
    problems.forEach(({ problemId, rating, name, tags, daysSinceSolve }) => {
      if (tags && tags.length > 0) {
        tags.forEach((tag) => {
          if (!groupedProblems[tag]) {
            groupedProblems[tag] = [];
          }
          // Avoid duplicate entries in the same tag group
          if (!groupedProblems[tag].some((p) => p.problemId === problemId)) {
            groupedProblems[tag].push({ problemId, name, rating, tags, daysSinceSolve });
          }
        });
      } else {
        // Problems without tags
        if (!groupedProblems["Untagged"]) {
          groupedProblems["Untagged"] = [];
        }
        groupedProblems["Untagged"].push({ problemId, name, rating, tags: [], daysSinceSolve });
      }
    });
  }

  const [expandedGroup, setExpandedGroup] = useState(null);

  const handleGroupClick = (group) => {
    if (expandedGroup === group) {
      setExpandedGroup(null);
    } else {
      setExpandedGroup(group);
    }
  };

  // Sort the groups
  const sortedGroups = Object.keys(groupedProblems).sort((a, b) => {
    if (groupBy === "rating") {
      // Sort ratings numerically, with "Unrated" at the end
      if (a === "Unrated") return 1;
      if (b === "Unrated") return -1;
      return parseInt(a) - parseInt(b);
    } else {
      // Sort tags alphabetically, with "Untagged" at the end
      if (a === "Untagged") return 1;
      if (b === "Untagged") return -1;
      return a.localeCompare(b);
    }
  });

  return (
    <div className="container-fluid">
      <h2>Problems by {groupBy === "rating" ? "Rating" : "Topic"}</h2>
      <div className="row">
        {sortedGroups.map((group) => (
          <div key={group} className="col-md-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">
                  {groupBy === "rating" ? `Rating: ${group}` : group}
                  <span className="badge bg-secondary ms-2">{groupedProblems[group].length}</span>
                </h5>
                <button
                  onClick={() => handleGroupClick(group)}
                  className={`btn btn-outline-dark ${expandedGroup === group ? "active" : ""
                    }`}
                >
                  {expandedGroup === group ? "Hide" : "Show"} Problems
                </button>
                {expandedGroup === group && (
                  <ul className="list-group mt-2">
                    {groupedProblems[group].map(
                      ({ problemId, name, rating, tags, daysSinceSolve }) => (
                        <li key={problemId} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-center">
                            <a
                              href={`https://codeforces.com/problemset/problem/${problemId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="custom-link"
                            >
                              {name}
                            </a>
                            <div className="d-flex align-items-center gap-2">
                              {groupBy === "tag" && rating && (
                                <span className="badge bg-info">{rating}</span>
                              )}
                              {showDaysSinceSolve && daysSinceSolve !== undefined && (
                                <span className="badge bg-secondary rounded-pill">
                                  {daysSinceSolve}d ago
                                </span>
                              )}
                            </div>
                          </div>
                          {tags && tags.length > 0 && (
                            <div className="problem-tags mt-1">
                              {tags.map((tag) => (
                                <span key={tag} className="badge bg-dark tag-small me-1">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </li>
                      )
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProblemTable;
