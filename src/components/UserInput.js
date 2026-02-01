// UserInput.js

import React, { useState, useEffect } from "react";
import "./ProblemTable.css";

const STORAGE_KEY = "cf-problem-finder-saved-requests";

function UserInput({ onUsernameSubmit, loading }) {
  const [includeHandles, setIncludeHandles] = useState([]);
  const [excludeHandles, setExcludeHandles] = useState([]);
  const [includeInput, setIncludeInput] = useState("");
  const [excludeInput, setExcludeInput] = useState("");
  const [savedRequests, setSavedRequests] = useState([]);
  const [showSaved, setShowSaved] = useState(false);

  // Load saved requests from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSavedRequests(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing saved requests:", e);
      }
    }
  }, []);

  // Save request to localStorage
  const saveRequest = (includeList, excludeList) => {
    const newRequest = {
      id: Date.now(),
      includeHandles: includeList,
      excludeHandles: excludeList,
      timestamp: new Date().toLocaleString(),
    };

    // Check if same request already exists
    const exists = savedRequests.some(
      (req) =>
        JSON.stringify(req.includeHandles.sort()) === JSON.stringify(includeList.sort()) &&
        JSON.stringify(req.excludeHandles.sort()) === JSON.stringify(excludeList.sort())
    );

    if (!exists) {
      const updated = [newRequest, ...savedRequests].slice(0, 10); // Keep last 10
      setSavedRequests(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  // Load a saved request
  const loadRequest = (request) => {
    setIncludeHandles(request.includeHandles);
    setExcludeHandles(request.excludeHandles);
    setShowSaved(false);
  };

  // Delete a saved request
  const deleteRequest = (id, e) => {
    e.stopPropagation();
    const updated = savedRequests.filter((req) => req.id !== id);
    setSavedRequests(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addHandle = (type) => {
    if (loading) return;
    const input = type === "include" ? includeInput : excludeInput;
    const setter = type === "include" ? setIncludeHandles : setExcludeHandles;
    const reset = type === "include" ? setIncludeInput : setExcludeInput;
    const currentList = type === "include" ? includeHandles : excludeHandles;

    const trimmed = input.trim();
    if (trimmed && !currentList.includes(trimmed)) {
      setter([...currentList, trimmed]);
      reset("");
    }
  };

  const removeHandle = (type, handle) => {
    if (loading) return;
    const setter = type === "include" ? setIncludeHandles : setExcludeHandles;
    const currentList = type === "include" ? includeHandles : excludeHandles;
    setter(currentList.filter((h) => h !== handle));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;
    if (includeHandles.length > 0) {
      saveRequest(includeHandles, excludeHandles);
      onUsernameSubmit(includeHandles, excludeHandles);
    } else {
      alert("There should be atleast 1 target user");
    }
  };

  const renderBadges = (type, handles) => (
    <div className="d-flex flex-wrap gap-2 mt-2">
      {handles.map((h) => (
        <span
          key={h}
          className={`badge rounded-pill d-flex align-items-center ${type === "include" ? "bg-primary" : "bg-danger"
            }`}
          style={{ padding: "8px 12px", fontSize: "0.9rem", cursor: loading ? "default" : "pointer" }}
          onClick={() => !loading && removeHandle(type, h)}
        >
          {h}
          {!loading && (
            <button
              type="button"
              className="btn-close btn-close-white ms-2"
              style={{ fontSize: "0.6rem", pointerEvents: "none" }}
              aria-label="Remove"
            ></button>
          )}
        </span>
      ))}
    </div>
  );

  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-md-10">
          {/* Saved Requests Section */}
          {savedRequests.length > 0 && (
            <div className="mb-3 position-relative">
              <button
                type="button"
                className="btn btn-outline-secondary w-100 d-flex justify-content-between align-items-center"
                onClick={() => setShowSaved(!showSaved)}
                disabled={loading}
              >
                <span>📋 Previous Requests ({savedRequests.length})</span>
                <span>{showSaved ? "▲" : "▼"}</span>
              </button>
              {showSaved && (
                <div className="card position-absolute w-100 mt-1 shadow" style={{ zIndex: 1000, maxHeight: "300px", overflowY: "auto" }}>
                  <ul className="list-group list-group-flush">
                    {savedRequests.map((req) => (
                      <li
                        key={req.id}
                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                        style={{ cursor: "pointer" }}
                        onClick={() => loadRequest(req)}
                      >
                        <div>
                          <div>
                            <span className="text-primary fw-bold">
                              {req.includeHandles.join(", ")}
                            </span>
                            {req.excludeHandles.length > 0 && (
                              <span className="text-muted">
                                {" "}- {req.excludeHandles.join(", ")}
                              </span>
                            )}
                          </div>
                          <small className="text-muted">{req.timestamp}</small>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={(e) => deleteRequest(req.id, e)}
                          title="Delete"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <form onSubmit={handleSubmit} className="card shadow-sm p-4 mb-4">
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label fw-bold text-primary">Target Users (Include)</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter handle..."
                    value={includeInput}
                    onChange={(e) => setIncludeInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addHandle("include"))}
                    disabled={loading}
                  />
                  <button
                    className="btn btn-outline-primary"
                    type="button"
                    onClick={() => addHandle("include")}
                    disabled={loading}
                  >
                    Add
                  </button>
                </div>
                {renderBadges("include", includeHandles)}
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold text-danger">Practice Users (Exclude)</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter handle..."
                    value={excludeInput}
                    onChange={(e) => setExcludeInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addHandle("exclude"))}
                    disabled={loading}
                  />
                  <button
                    className="btn btn-outline-danger"
                    type="button"
                    onClick={() => addHandle("exclude")}
                    disabled={loading}
                  >
                    Add
                  </button>
                </div>
                {renderBadges("exclude", excludeHandles)}
              </div>
            </div>
            <div className="text-center mt-4 border-top pt-3">
              <button
                className="btn btn-dark btn-lg px-5 shadow-sm"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Finding...
                  </>
                ) : (
                  "Find Problems"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UserInput;
