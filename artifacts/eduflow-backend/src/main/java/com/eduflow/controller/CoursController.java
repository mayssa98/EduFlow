package com.eduflow.controller;

import com.eduflow.model.dto.CoursDtos.*;
import com.eduflow.model.entity.SupportPedagogique;
import com.eduflow.service.CoursService;
import com.eduflow.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/courses")
@Tag(name = "Courses", description = "Course CRUD, file upload, file serving")
@ApiResponses({
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "204", description = "No content (delete)"),
        @ApiResponse(responseCode = "400", description = "Validation error or invalid file type / oversize"),
        @ApiResponse(responseCode = "401", description = "Authentication required"),
        @ApiResponse(responseCode = "403", description = "Forbidden — not the owning teacher or course not visible"),
        @ApiResponse(responseCode = "404", description = "Course or file not found")
})
public class CoursController {

    private final CoursService service;
    private final FileStorageService storage;

    public CoursController(CoursService s, FileStorageService st) {
        this.service = s; this.storage = st;
    }

    @GetMapping
    @Operation(summary = "List courses visible to the caller")
    public List<CoursResponse> list() { return service.listVisible(); }

    @GetMapping("/{id}")
    @Operation(summary = "Get a course by id")
    public CoursResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @PreAuthorize("hasRole('ENSEIGNANT')")
    @Operation(summary = "Create a course (teacher only, status DRAFT)")
    public CoursResponse create(@Valid @RequestBody CoursCreateRequest req) { return service.create(req); }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ENSEIGNANT')")
    @Operation(summary = "Update a course (owning teacher only)")
    public CoursResponse update(@PathVariable Long id, @Valid @RequestBody CoursUpdateRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ENSEIGNANT')")
    @Operation(summary = "Delete a course (owning teacher only)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasRole('ENSEIGNANT')")
    @Operation(summary = "Publish a course (DRAFT → PUBLISHED)")
    public CoursResponse publish(@PathVariable Long id) { return service.publish(id); }

    @PatchMapping("/{id}/archive")
    @PreAuthorize("hasRole('ENSEIGNANT')")
    @Operation(summary = "Archive a course")
    public CoursResponse archive(@PathVariable Long id) { return service.archive(id); }

    @PostMapping(value = "/{id}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ENSEIGNANT')")
    @Operation(summary = "Upload PDF (≤25MB) or MP4 (≤250MB) — magic-byte validated")
    public SupportResponse upload(@PathVariable Long id, @RequestPart("file") MultipartFile file) throws IOException {
        return service.uploadFile(id, file);
    }

    @GetMapping("/{id}/files")
    @Operation(summary = "List uploaded materials for a course")
    public List<SupportResponse> listFiles(@PathVariable Long id) { return service.listFiles(id); }

    @GetMapping("/{id}/files/{fileId}")
    @Operation(summary = "Download or stream a course file")
    public ResponseEntity<Resource> serve(@PathVariable Long id, @PathVariable Long fileId) throws IOException {
        SupportPedagogique sp = service.getFileForServing(id, fileId);
        Resource r = storage.loadAsResource(sp.getCheminFichier());
        MediaType type = switch (sp.getTypeFichier()) {
            case PDF -> MediaType.APPLICATION_PDF;
            case MP4 -> MediaType.parseMediaType("video/mp4");
        };
        String safeName = sp.getTitre().replaceAll("[\\r\\n\"]", "_");
        return ResponseEntity.ok()
                .contentType(type)
                .contentLength(sp.getTailleOctets())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + safeName + "\"")
                .body(r);
    }

    @DeleteMapping("/{id}/files/{fileId}")
    @PreAuthorize("hasRole('ENSEIGNANT')")
    @Operation(summary = "Delete a course file (owner only)")
    public ResponseEntity<Void> deleteFile(@PathVariable Long id, @PathVariable Long fileId) {
        service.deleteFile(id, fileId);
        return ResponseEntity.noContent().build();
    }
}
