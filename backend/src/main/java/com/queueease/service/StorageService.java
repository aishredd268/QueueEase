package com.queueease.service;

import com.queueease.exception.ApiException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/** Local file storage (streams to disk, so file size is not limited by memory). Replace to use S3 / Supabase later. */
@Service
public class StorageService {
    private final Path root;

    public StorageService(@Value("${app.upload-dir}") String dir) {
        this.root = Paths.get(dir).toAbsolutePath().normalize();
    }

    public String save(String owner, String fid, String original, MultipartFile file) throws IOException {
        Path dir = root.resolve("students").resolve(owner);
        Files.createDirectories(dir);
        String safe = original.replaceAll("[^A-Za-z0-9._-]", "_");
        Path p = dir.resolve(fid + "-" + safe);
        try (InputStream in = file.getInputStream()) { Files.copy(in, p, StandardCopyOption.REPLACE_EXISTING); }
        return p.toString();
    }

    public Path resolve(String path) {
        Path p = Paths.get(path).toAbsolutePath().normalize();
        if (!p.startsWith(root)) throw new ApiException(403, "Access denied.");
        return p;
    }

    public byte[] head(String path, int n) {
        try (InputStream in = Files.newInputStream(resolve(path))) { return in.readNBytes(n); }
        catch (IOException e) { return new byte[0]; }
    }

    public void delete(String path) {
        try { Files.deleteIfExists(resolve(path)); } catch (IOException ignored) { }
    }
}
