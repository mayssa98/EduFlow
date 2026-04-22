package com.eduflow.service;

import com.eduflow.config.AppProperties;
import com.eduflow.model.entity.enums.TypeFichier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);
    private static final long AVATAR_MAX_BYTES = 5L * 1024 * 1024;
    private static final List<String> ALLOWED_AVATAR_TYPES = List.of("image/jpeg", "image/png", "image/webp");
    private final AppProperties props;
    private final Path baseDir;

    public FileStorageService(AppProperties props) throws IOException {
        this.props = props;
        this.baseDir = Paths.get(props.getUpload().getDir()).toAbsolutePath().normalize();
        Files.createDirectories(baseDir);
    }

    public record StoredFile(String relativePath, long sizeBytes, TypeFichier type) {}

    public StoredFile storeCourseFile(Long coursId, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        TypeFichier type = detectMagic(file);
        long max = (type == TypeFichier.PDF)
                ? props.getUpload().getPdfMaxBytes()
                : props.getUpload().getMp4MaxBytes();
        if (file.getSize() > max) {
            throw new IllegalArgumentException(type + " exceeds max size of " + max + " bytes");
        }

        String ext = (type == TypeFichier.PDF) ? ".pdf" : ".mp4";
        String filename = UUID.randomUUID() + ext;
        Path courseDir = baseDir.resolve("courses").resolve(String.valueOf(coursId));
        Files.createDirectories(courseDir);
        Path target = courseDir.resolve(filename);

        try (InputStream in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }
        String rel = baseDir.relativize(target).toString().replace('\\', '/');
        log.info("Stored course file id={} type={} size={}", coursId, type, file.getSize());
        return new StoredFile(rel, file.getSize(), type);
    }

    public String storeAvatarFile(Long userId, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Avatar file is empty");
        }
        if (file.getSize() > AVATAR_MAX_BYTES) {
            throw new IllegalArgumentException("Avatar exceeds max size of " + AVATAR_MAX_BYTES + " bytes");
        }

        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase(Locale.ROOT) : "";
        if (!contentType.isBlank() && !ALLOWED_AVATAR_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Unsupported avatar type");
        }

        String ext = detectAvatarExtension(file.getOriginalFilename(), contentType);
        String filename = UUID.randomUUID() + ext;
        Path avatarDir = baseDir.resolve("avatars").resolve(String.valueOf(userId));
        Files.createDirectories(avatarDir);
        Path target = avatarDir.resolve(filename);

        try (InputStream in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }

        String rel = baseDir.relativize(target).toString().replace('\\', '/');
        log.info("Stored avatar file userId={} type={} size={}", userId, contentType, file.getSize());
        return rel;
    }

    public Resource loadAsResource(String relativePath) throws IOException {
        Path p = baseDir.resolve(relativePath).normalize();
        if (!p.startsWith(baseDir)) {
            throw new IllegalArgumentException("Invalid path");
        }
        if (!Files.exists(p)) {
            throw new com.eduflow.exception.NotFoundException("File not found");
        }
        Resource r = new UrlResource(p.toUri());
        if (!r.isReadable()) throw new IllegalArgumentException("File not readable");
        return r;
    }

    public void delete(String relativePath) {
        try {
            Path p = baseDir.resolve(relativePath).normalize();
            if (p.startsWith(baseDir)) Files.deleteIfExists(p);
        } catch (IOException e) {
            log.warn("Failed to delete {}: {}", relativePath, e.getMessage());
        }
    }

    private String detectAvatarExtension(String originalFilename, String contentType) {
        String lowerName = originalFilename != null ? originalFilename.toLowerCase(Locale.ROOT) : "";
        if (lowerName.endsWith(".png")) return ".png";
        if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) return ".jpg";
        if (lowerName.endsWith(".webp")) return ".webp";
        if ("image/png".equals(contentType)) return ".png";
        if ("image/jpeg".equals(contentType)) return ".jpg";
        if ("image/webp".equals(contentType)) return ".webp";
        throw new IllegalArgumentException("Unsupported avatar extension");
    }

    /** Detects PDF / MP4 by reading magic bytes. Throws if neither matches. */
    private TypeFichier detectMagic(MultipartFile file) throws IOException {
        byte[] head = new byte[12];
        try (InputStream in = file.getInputStream()) {
            int read = in.read(head);
            if (read < 4) throw new IllegalArgumentException("File too small to identify");
        }
        // PDF: %PDF (0x25 0x50 0x44 0x46)
        if (head[0] == 0x25 && head[1] == 0x50 && head[2] == 0x44 && head[3] == 0x46) {
            return TypeFichier.PDF;
        }
        // MP4 / ISO base media: bytes 4..7 = "ftyp"
        if (head.length >= 8
                && head[4] == 0x66 && head[5] == 0x74 && head[6] == 0x79 && head[7] == 0x70) {
            return TypeFichier.MP4;
        }
        throw new IllegalArgumentException("Unsupported file type — only PDF or MP4 are accepted");
    }
}
