package com.helvinotech.hms.service;

import com.helvinotech.hms.entity.ActivityLog;
import com.helvinotech.hms.entity.User;
import com.helvinotech.hms.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    @Transactional(readOnly = false)
    public void log(User user, String action, String entityType, Long entityId, String details) {
        ActivityLog log = ActivityLog.builder()
                .user(user)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .build();
        activityLogRepository.save(log);
    }

    public Page<ActivityLog> getAllLogs(Pageable pageable) {
        return activityLogRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    public Page<ActivityLog> getLogsByUser(Long userId, Pageable pageable) {
        return activityLogRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }
}
