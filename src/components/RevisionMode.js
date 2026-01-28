// RevisionMode.js

import React, { useState } from "react";
import "./ProblemTable.css";

function RevisionMode({ onRevisionSubmit, loading }) {
    const [username, setUsername] = useState("");
    const [minRating, setMinRating] = useState("");
    const [maxRating, setMaxRating] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (loading) return;
        if (username.trim()) {
            onRevisionSubmit(
                username.trim(),
                minRating ? parseInt(minRating, 10) : null,
                maxRating ? parseInt(maxRating, 10) : null
            );
        } else {
            alert("Please enter your Codeforces username");
        }
    };

    return (
        <div className="container-fluid">
            <div className="row justify-content-center">
                <div className="col-md-10">
                    <form onSubmit={handleSubmit} className="card shadow-sm p-4 mb-4">
                        <div className="row g-3 align-items-end">
                            <div className="col-md-4">
                                <label className="form-label fw-bold text-success">
                                    Your Username
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter your handle..."
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label fw-bold text-muted">
                                    Min Rating (optional)
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className="form-control"
                                    placeholder="e.g., 800"
                                    value={minRating}
                                    onChange={(e) => setMinRating(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label fw-bold text-muted">
                                    Max Rating (optional)
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className="form-control"
                                    placeholder="e.g., 1200"
                                    value={maxRating}
                                    onChange={(e) => setMaxRating(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="col-md-2">
                                <button
                                    className="btn btn-success btn-lg w-100 shadow-sm"
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
                                            Loading...
                                        </>
                                    ) : (
                                        "Revise"
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="mt-3 text-muted small">
                            <i className="bi bi-info-circle"></i> Problems you solved longest
                            ago will appear first for revision (spaced repetition).
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default RevisionMode;
