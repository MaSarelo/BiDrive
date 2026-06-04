package com.bidrive.backend.controller;

import com.bidrive.backend.entity.Brand;
import com.bidrive.backend.entity.City;
import com.bidrive.backend.entity.Model;
import com.bidrive.backend.entity.Region;
import com.bidrive.backend.repository.BrandRepository;
import com.bidrive.backend.repository.CityRepository;
import com.bidrive.backend.repository.ModelRepository;
import com.bidrive.backend.repository.RegionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/data")
@RequiredArgsConstructor
public class AdminDataController {

    private final BrandRepository brandRepository;
    private final ModelRepository modelRepository;
    private final RegionRepository regionRepository;
    private final CityRepository cityRepository;

    // === BRANDS ===

    @GetMapping("/brands")
    public List<Brand> getAllBrands() {
        return brandRepository.findAllByOrderByNameAsc();
    }

    @PostMapping("/brands")
    public Brand createBrand(@RequestBody Brand brand) {
        return brandRepository.save(brand);
    }

    @DeleteMapping("/brands/{id}")
    public ResponseEntity<?> deleteBrand(@PathVariable Long id) {
        if (!brandRepository.existsById(id)) return ResponseEntity.notFound().build();
        try {
            brandRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (DataIntegrityViolationException e) {
            // Если есть связанные модели или лоты
            return ResponseEntity.badRequest().body("Невозможно удалить марку: она используется в моделях или лотах.");
        }
    }

    @PutMapping("/brands/{id}")
    public ResponseEntity<?> updateBrand(@PathVariable Long id, @RequestBody Brand brand) {
        return brandRepository.findById(id)
                .map(existingBrand -> {
                    existingBrand.setName(brand.getName());
                    brandRepository.save(existingBrand);
                    return ResponseEntity.ok(existingBrand);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // === MODELS ===

    @GetMapping("/models")
    public List<Model> getAllModels() {
        return modelRepository.findAllByOrderByNameAsc();
    }

    @PostMapping("/models")
    public Model createModel(@RequestParam String name, @RequestParam Long brandId) {
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new RuntimeException("Brand not found"));
        Model model = new Model();
        model.setName(name);
        model.setBrand(brand);
        return modelRepository.save(model);
    }

    @DeleteMapping("/models/{id}")
    public ResponseEntity<?> deleteModel(@PathVariable Long id) {
        if (!modelRepository.existsById(id)) return ResponseEntity.notFound().build();
        try {
            modelRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (DataIntegrityViolationException e) {
            // Если есть связанные лоты
            return ResponseEntity.badRequest().body("Невозможно удалить модель: она используется в лотах.");
        }
    }

    @PutMapping("/models/{id}")
    public ResponseEntity<?> updateModel(@PathVariable Long id, @RequestParam String name) {
        return modelRepository.findById(id)
                .map(existingModel -> {
                    existingModel.setName(name);
                    modelRepository.save(existingModel);
                    return ResponseEntity.ok(existingModel);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // === REGIONS ===

    @GetMapping("/regions")
    public List<Region> getAllRegions() {
        return regionRepository.findAllByOrderByNameAsc();
    }

    @DeleteMapping("/regions/{id}")
    public ResponseEntity<?> deleteRegion(@PathVariable Integer id) {
        if (!regionRepository.existsById(id)) return ResponseEntity.notFound().build();
        try {
            regionRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (DataIntegrityViolationException e) {
            // Если есть связанные города
            return ResponseEntity.badRequest().body("Невозможно удалить область: в ней есть города.");
        }
    }

    // === CITIES ===

    @GetMapping("/cities")
    public List<City> getAllCities() {
        return cityRepository.findAllByOrderByNameAsc();
    }

    @PostMapping("/cities")
    public City createCity(@RequestParam String name, @RequestParam Integer regionId) {
        Region region = regionRepository.findById(regionId)
                .orElseThrow(() -> new RuntimeException("Region not found"));
        City city = new City();
        city.setName(name);
        city.setRegion(region);
        return cityRepository.save(city);
    }

    @DeleteMapping("/cities/{id}")
    public ResponseEntity<?> deleteCity(@PathVariable Integer id) {
        if (!cityRepository.existsById(id)) return ResponseEntity.notFound().build();
        try {
            cityRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (DataIntegrityViolationException e) {
            // Если есть связанные лоты
            return ResponseEntity.badRequest().body("Невозможно удалить город: он используется в лотах.");
        }
    }

    @PutMapping("/cities/{id}")
    public ResponseEntity<?> updateCity(@PathVariable Integer id, @RequestParam String name, @RequestParam Integer regionId) {
        return cityRepository.findById(id)
                .map(existingCity -> {
                    existingCity.setName(name);
                    Region region = regionRepository.findById(regionId)
                            .orElseThrow(() -> new RuntimeException("Region not found"));
                    existingCity.setRegion(region);
                    cityRepository.save(existingCity);
                    return ResponseEntity.ok(existingCity);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}