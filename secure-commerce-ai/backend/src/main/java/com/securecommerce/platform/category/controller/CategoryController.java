package com.securecommerce.platform.category.controller;

import com.securecommerce.platform.category.dto.CategoryResponse;
import com.securecommerce.platform.category.repository.CategoryRepository;
import com.securecommerce.platform.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * CategoryController — GET /api/categories
 *
 * Public endpoint — no authentication required.
 * Used by the product browse page to populate the category filter dropdown.
 */
@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    /**
     * GET /api/categories
     * Returns all active categories, ordered by name.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        List<CategoryResponse> categories = categoryRepository
                .findByActiveTrueOrderByNameAsc()
                .stream()
                .map(CategoryResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Categories retrieved", categories));
    }
}
