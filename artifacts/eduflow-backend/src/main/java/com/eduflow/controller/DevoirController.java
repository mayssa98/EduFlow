package com.eduflow.controller;

import com.eduflow.model.dto.DevoirDtos.*;
import com.eduflow.service.DevoirService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/assignments")
@Tag(name = "Assignments", description = "Assignment CRUD, submissions, grading")
@ApiResponses({
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "204", description = "No content (delete)"),
        @ApiResponse(responseCode = "400", description = "Validation error, deadline passed, or already graded"),
        @ApiResponse(responseCode = "401", description = "Authentication required"),
        @ApiResponse(responseCode = "403", description = "Forbidden — not the owning teacher / not enrolled"),
        @ApiResponse(responseCode = "404", description = "Assignment or submission not found")
})
public class DevoirController {

    private final DevoirService service;

    public DevoirController(DevoirService s) { this.service = s; }

    @GetMapping
    @Operation(summary = "List assignments for a course")
    public List<DevoirResponse> listForCourse(@RequestParam Long courseId) {
        return service.listForCourse(courseId);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get an assignment by id")
    public DevoirResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @PreAuthorize("hasRole('ENSEIGNANT')")
    @Operation(summary = "Create an assignment (must own the course)")
    public DevoirResponse create(@Valid @RequestBody DevoirCreateRequest req) { return service.create(req); }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ENSEIGNANT')")
    @Operation(summary = "Update an assignment")
    public DevoirResponse update(@PathVariable Long id, @Valid @RequestBody DevoirUpdateRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ENSEIGNANT')")
    @Operation(summary = "Delete an assignment")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/submissions")
    @PreAuthorize("hasRole('ETUDIANT')")
    @Operation(summary = "Student submits to an assignment (server enforces deadline)")
    public SoumissionResponse submit(@PathVariable Long id, @Valid @RequestBody SoumissionCreateRequest req) {
        return service.submit(id, req);
    }

    @GetMapping("/{id}/submissions")
    @PreAuthorize("hasAnyRole('ENSEIGNANT','ADMIN')")
    @Operation(summary = "List submissions for an assignment (course owner)")
    public List<SoumissionResponse> listSubmissions(@PathVariable Long id) {
        return service.listSubmissions(id);
    }

    @PatchMapping("/submissions/{id}/grade")
    @PreAuthorize("hasRole('ENSEIGNANT')")
    @Operation(summary = "Grade a submission (0–20). Note is final and cannot be edited after grading.")
    public SoumissionResponse grade(@PathVariable Long id, @Valid @RequestBody SoumissionGradeRequest req) {
        return service.grade(id, req);
    }

    @GetMapping("/me/submissions")
    @PreAuthorize("hasRole('ETUDIANT')")
    @Operation(summary = "List the current student's submissions")
    public List<SoumissionResponse> mySubmissions() { return service.mySubmissions(); }
}
