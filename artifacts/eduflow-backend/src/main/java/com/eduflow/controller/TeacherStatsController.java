package com.eduflow.controller;

import com.eduflow.model.dto.AdminDtos.TeacherStats;
import com.eduflow.service.StatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@org.springframework.security.access.prepost.PreAuthorize("hasRole('ENSEIGNANT')")
@RequestMapping("/teacher")
@Tag(name = "Teacher", description = "Teacher dashboard statistics")
@ApiResponses({
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "401", description = "Authentication required"),
        @ApiResponse(responseCode = "403", description = "Forbidden — caller is not ENSEIGNANT")
})
public class TeacherStatsController {

    private final StatsService stats;

    public TeacherStatsController(StatsService stats) { this.stats = stats; }

    @GetMapping("/stats")
    @Operation(summary = "Aggregate stats for the teacher dashboard")
    public TeacherStats teacherStats() { return stats.teacherStats(); }
}
