// UserInput.js

import React, { useState } from "react";
import "./ProblemTable.css";

function UserInput({ onUsernameSubmit, loading }) {
  const [includeHandles, setIncludeHandles] = useState([]);
  const [excludeHandles, setExcludeHandles] = useState([]);
  const [includeInput, setIncludeInput] = useState("");
  const [excludeInput, setExcludeInput] = useState("");

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
