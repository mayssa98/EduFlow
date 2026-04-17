package com.eduflow.controller;

import com.eduflow.model.dto.AiDtos.*;
import com.eduflow.service.AnalyseIAService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ai")
@Tag(name = "AI", description = "Predictive pedagogical risk analysis (Gemini + heuristic fallback)")
@ApiResponses({
        @ApiResponse(responseCode = "200", description = "Analysis completed (heuristic fallback may be used — see utiliseFallback)"),
        @ApiResponse(responseCode = "400", description = "No enrolled students with data, or invalid course"),
        @ApiResponse(responseCode = "401", description = "Authentication required"),
        @ApiResponse(responseCode = "403", description = "Forbidden — not the course owner")
})
public class AnalyseIAController {

    private final AnalyseIAService service;

    public AnalyseIAController(AnalyseIAService service) { this.service = service; }

    @PostMapping("/pedagogical-risk-analysis")
    @PreAuthorize("hasRole('ENSEIGNANT')")
    @Operation(summary = "Run an AI risk analysis for the given course (teacher must own it)")
    public AnalyseResponse analyze(@Valid @RequestBody AnalyseRequest req) {
        return service.analyze(req.coursId());
    }
}
