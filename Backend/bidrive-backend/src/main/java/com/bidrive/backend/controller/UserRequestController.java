package com.bidrive.backend.controller;

import com.bidrive.backend.service.ExtensionRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auctions")
@RequiredArgsConstructor
public class UserRequestController {

    private final ExtensionRequestService extensionRequestService;

    @PostMapping("/{id}/request-extend")
    public ResponseEntity<?> requestExtension(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam(required = false) String reason) {
        try {
            extensionRequestService.createRequest(id, userId, reason);
            return ResponseEntity.ok("Запрос отправлен администратору");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}