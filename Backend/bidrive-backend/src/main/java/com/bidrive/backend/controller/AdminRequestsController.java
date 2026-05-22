package com.bidrive.backend.controller;

import com.bidrive.backend.dto.ExtensionRequestDto;
import com.bidrive.backend.entity.ExtensionRequest;
import com.bidrive.backend.service.ExtensionRequestService;
import com.bidrive.backend.repository.ExtensionRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional; // <-- ИМПОРТ
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/requests")
@RequiredArgsConstructor
public class AdminRequestsController {

    private final ExtensionRequestService extensionRequestService;
    private final ExtensionRequestRepository extensionRequestRepository;

    @GetMapping
    @Transactional(readOnly = true) // <-- РЕШЕНИЕ: держит сессию открытой
    public List<ExtensionRequestDto> getPendingRequests() {
        return extensionRequestRepository.findByStatusOrderByCreatedAtDesc(ExtensionRequest.RequestStatus.PENDING)
                .stream().map(req -> {
                    ExtensionRequestDto dto = new ExtensionRequestDto();
                    dto.setId(req.getId());
                    dto.setAuctionId(req.getAuction().getId());

                    // Теперь эти вызовы работают, т.к. сессия открыта
                    dto.setCarName(req.getAuction().getBrand().getName() + " " + req.getAuction().getModel().getName());
                    dto.setSellerName(req.getUser().getFirstName() + " " + req.getUser().getLastName());

                    dto.setStatus(req.getStatus().name());
                    dto.setReason(req.getReason());
                    dto.setCreatedAt(req.getCreatedAt());
                    return dto;
                }).collect(Collectors.toList());
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable Long id) {
        try {
            extensionRequestService.approveRequest(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable Long id) {
        try {
            extensionRequestService.rejectRequest(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}