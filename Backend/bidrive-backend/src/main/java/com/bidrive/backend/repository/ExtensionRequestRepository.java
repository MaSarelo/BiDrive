package com.bidrive.backend.repository;

import com.bidrive.backend.entity.ExtensionRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExtensionRequestRepository extends JpaRepository<ExtensionRequest, Long> {

    List<ExtensionRequest> findByStatusOrderByCreatedAtDesc(ExtensionRequest.RequestStatus status);

    boolean existsByAuctionIdAndStatus(Long auctionId, ExtensionRequest.RequestStatus status);
}