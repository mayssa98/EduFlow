package com.eduflow.controller;

import com.eduflow.model.dto.AdminDtos.TeacherStats;
import com.eduflow.service.StatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/teacher")
@Tag(name = "Teacher", description = "Teacher dashboard statistics")
public class TeacherStatsController {

    private final StatsService stats;

    public TeacherStatsController(StatsService stats) { this.stats = stats; }

    @GetMapping("/stats")
    @Operation(summary = "Aggregate stats for the teacher dashboard")
    public TeacherStats teacherStats() { return stats.teacherStats(); }
}
