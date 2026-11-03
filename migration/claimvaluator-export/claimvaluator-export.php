<?php
/**
 * Plugin Name: ClaimValuator Export
 * Description: One-click export of every page, post, lawyer profile, image record, menu, redirect and SEO field, for the move to the new ClaimValuator site. Read-only: it changes nothing on this site.
 * Version: 1.0.0
 * Requires PHP: 7.4
 * Author: ClaimValuator
 * License: GPL-2.0-or-later
 */

defined( 'ABSPATH' ) || exit;

final class CV_Export {

	const ACTION = 'cv_export_download';

	public static function init(): void {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ) );
		add_action( 'admin_post_' . self::ACTION, array( __CLASS__, 'download' ) );
	}

	public static function menu(): void {
		add_management_page( 'ClaimValuator Export', 'ClaimValuator Export', 'manage_options', 'cv-export', array( __CLASS__, 'screen' ) );
	}

	public static function screen(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		echo '<div class="wrap"><h1>ClaimValuator Export</h1>';
		echo '<p>Downloads one JSON file with every page, post, lawyer profile, image record, menu, category, redirect and Rank Math SEO field, with each page’s blocks rendered to HTML.</p>';
		echo '<p>This only reads. Nothing on the site is changed. Passwords and user email addresses are never included.</p>';
		echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
		wp_nonce_field( self::ACTION );
		echo '<input type="hidden" name="action" value="' . esc_attr( self::ACTION ) . '">';
		echo '<p><label><input type="checkbox" name="leads" value="1"> Also include case-review leads (contains visitors’ personal details; keep the file private)</label></p>';
		submit_button( 'Download export file' );
		echo '</form></div>';
	}

	private static function out( $v ): void {
		echo wp_json_encode( $v, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
	}

	public static function download(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'Not allowed.', 403 );
		}
		check_admin_referer( self::ACTION );
		$with_leads = ! empty( $_POST['leads'] );

		@set_time_limit( 0 ); // phpcs:ignore
		nocache_headers();
		header( 'Content-Type: application/json; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename="claimvaluator-export-' . gmdate( 'Y-m-d' ) . '.json"' );
		while ( ob_get_level() ) {
			ob_end_clean();
		}

		echo '{"version":1,"exported":';
		self::out( gmdate( 'c' ) );

		echo ',"site":';
		self::out(
			array(
				'home'                 => home_url( '/' ),
				'name'                 => get_bloginfo( 'name' ),
				'description'          => get_bloginfo( 'description' ),
				'permalink_structure'  => get_option( 'permalink_structure' ),
				'page_on_front'        => (int) get_option( 'page_on_front' ),
				'page_for_posts'       => (int) get_option( 'page_for_posts' ),
				'show_on_front'        => get_option( 'show_on_front' ),
				'category_base'        => get_option( 'category_base' ),
				'uploads_baseurl'      => wp_get_upload_dir()['baseurl'],
			)
		);

		echo ',"users":';
		$users = array();
		foreach ( get_users( array( 'fields' => 'all' ) ) as $u ) {
			$users[] = array(
				'id'          => $u->ID,
				'login'       => $u->user_login,
				'slug'        => $u->user_nicename,
				'name'        => $u->display_name,
				'description' => get_user_meta( $u->ID, 'description', true ),
				'url'         => $u->user_url,
				'roles'       => array_values( (array) $u->roles ),
			);
		}
		self::out( $users );

		echo ',"terms":';
		$terms = array();
		foreach ( get_taxonomies( array(), 'names' ) as $tax ) {
			if ( in_array( $tax, array( 'nav_menu', 'link_category', 'post_format', 'wp_theme', 'wp_template_part_area' ), true ) ) {
				continue;
			}
			foreach ( get_terms( array( 'taxonomy' => $tax, 'hide_empty' => false ) ) as $t ) {
				$terms[] = array(
					'id'          => $t->term_id,
					'taxonomy'    => $tax,
					'name'        => $t->name,
					'slug'        => $t->slug,
					'description' => $t->description,
					'parent'      => $t->parent,
					'link'        => is_taxonomy_viewable( $tax ) ? wp_make_link_relative( get_term_link( $t ) ) : '',
					'meta'        => self::rank_math_term_meta( $t->term_id ),
				);
			}
		}
		self::out( $terms );

		echo ',"menus":';
		$menus = array();
		$locations = get_nav_menu_locations();
		foreach ( wp_get_nav_menus() as $m ) {
			$items = array();
			foreach ( (array) wp_get_nav_menu_items( $m->term_id ) as $it ) {
				$items[] = array(
					'id'        => $it->ID,
					'parent'    => (int) $it->menu_item_parent,
					'title'     => $it->title,
					'url'       => wp_make_link_relative( $it->url ),
					'object'    => $it->object,
					'object_id' => (int) $it->object_id,
					'order'     => (int) $it->menu_order,
				);
			}
			$menus[] = array(
				'name'      => $m->name,
				'slug'      => $m->slug,
				'locations' => array_keys( array_filter( $locations, static fn( $id ) => (int) $id === (int) $m->term_id ) ),
				'items'     => $items,
			);
		}
		self::out( $menus );

		echo ',"redirects":';
		self::out( self::redirects() );

		echo ',"attachments":[';
		$first = true;
		$q     = new WP_Query( array( 'post_type' => 'attachment', 'post_status' => 'inherit', 'posts_per_page' => -1, 'fields' => 'ids', 'no_found_rows' => true ) );
		foreach ( $q->posts as $id ) {
			$meta = wp_get_attachment_metadata( $id );
			echo $first ? '' : ',';
			$first = false;
			self::out(
				array(
					'id'       => $id,
					'url'      => wp_get_attachment_url( $id ),
					'file'     => get_post_meta( $id, '_wp_attached_file', true ),
					'mime'     => get_post_mime_type( $id ),
					'title'    => get_the_title( $id ),
					'alt'      => get_post_meta( $id, '_wp_attachment_image_alt', true ),
					'caption'  => wp_get_attachment_caption( $id ),
					'width'    => is_array( $meta ) ? ( $meta['width'] ?? null ) : null,
					'height'   => is_array( $meta ) ? ( $meta['height'] ?? null ) : null,
					'parent'   => (int) wp_get_post_parent_id( $id ),
					'date_gmt' => get_post_field( 'post_date_gmt', $id ),
				)
			);
		}
		echo ']';

		echo ',"posts":[';
		$types = array_values( array_diff( get_post_types( array( 'public' => true ), 'names' ), array( 'attachment' ) ) );
		foreach ( array( 'wp_block', 'cv_expert' ) as $extra ) {
			if ( post_type_exists( $extra ) && ! in_array( $extra, $types, true ) ) {
				$types[] = $extra;
			}
		}
		if ( $with_leads && post_type_exists( 'cv_lead' ) ) {
			$types[] = 'cv_lead';
		}
		$first = true;
		$page  = 1;
		do {
			$q = new WP_Query(
				array(
					'post_type'      => $types,
					'post_status'    => array( 'publish', 'draft', 'future', 'pending', 'private' ),
					'posts_per_page' => 50,
					'paged'          => $page,
					'orderby'        => 'ID',
					'order'          => 'ASC',
				)
			);
			foreach ( $q->posts as $p ) {
				echo $first ? '' : ',';
				$first = false;
				self::out( self::post( $p ) );
				flush();
			}
			$page++;
			wp_reset_postdata();
		} while ( $page <= $q->max_num_pages );
		echo ']}';
		exit;
	}

	private static function post( WP_Post $p ): array {
		global $post;
		$post = $p; // phpcs:ignore WordPress.WP.GlobalVariablesOverride
		setup_postdata( $p );

		$blocks = array();
		foreach ( parse_blocks( $p->post_content ) as $b ) {
			if ( empty( $b['blockName'] ) && '' === trim( $b['innerHTML'] ) ) {
				continue;
			}
			$html = '';
			try {
				$html = render_block( $b );
			} catch ( \Throwable $e ) {
				$html = '';
			}
			$blocks[] = array(
				'name'  => $b['blockName'],
				'attrs' => $b['attrs'],
				'html'  => $html,
			);
		}

		$meta = array();
		foreach ( get_post_meta( $p->ID ) as $k => $vals ) {
			if ( 0 === strpos( $k, '_cv' ) || 0 === strpos( $k, 'rank_math_' ) || in_array( $k, array( '_wp_page_template', '_thumbnail_id' ), true ) ) {
				$meta[ $k ] = maybe_unserialize( $vals[0] );
			}
		}

		$terms = array();
		foreach ( get_object_taxonomies( $p->post_type ) as $tax ) {
			$list = get_the_terms( $p->ID, $tax );
			if ( is_array( $list ) ) {
				$terms[ $tax ] = wp_list_pluck( $list, 'slug' );
			}
		}

		$thumb = get_post_thumbnail_id( $p );
		$out   = array(
			'id'           => $p->ID,
			'type'         => $p->post_type,
			'status'       => $p->post_status,
			'slug'         => $p->post_name,
			'parent'       => $p->post_parent,
			'path'         => 'publish' === $p->post_status ? wp_make_link_relative( get_permalink( $p ) ) : '',
			'title'        => $p->post_title,
			'excerpt'      => $p->post_excerpt,
			'date_gmt'     => $p->post_date_gmt,
			'modified_gmt' => $p->post_modified_gmt,
			'author'       => (int) $p->post_author,
			'menu_order'   => $p->menu_order,
			'thumbnail'    => $thumb ? (int) $thumb : null,
			'terms'        => $terms,
			'meta'         => $meta,
			'seo'          => self::seo( $p ),
			'content'      => $p->post_content,
			'blocks'       => $blocks,
		);
		wp_reset_postdata();
		return $out;
	}

	/** Rank Math values with variables such as %title% already filled in. */
	private static function seo( WP_Post $p ): array {
		$title = get_post_meta( $p->ID, 'rank_math_title', true );
		$desc  = get_post_meta( $p->ID, 'rank_math_description', true );
		if ( class_exists( '\RankMath\Helper' ) && method_exists( '\RankMath\Helper', 'replace_vars' ) ) {
			if ( ! $title && method_exists( '\RankMath\Helper', 'get_settings' ) ) {
				$title = \RankMath\Helper::get_settings( 'titles.pt_' . $p->post_type . '_title' );
			}
			if ( ! $desc && method_exists( '\RankMath\Helper', 'get_settings' ) ) {
				$desc = \RankMath\Helper::get_settings( 'titles.pt_' . $p->post_type . '_description' );
			}
			$title = $title ? \RankMath\Helper::replace_vars( $title, $p ) : '';
			$desc  = $desc ? \RankMath\Helper::replace_vars( $desc, $p ) : '';
		}
		return array(
			'title'       => wp_strip_all_tags( (string) $title ),
			'description' => wp_strip_all_tags( (string) $desc ),
			'robots'      => get_post_meta( $p->ID, 'rank_math_robots', true ),
			'canonical'   => get_post_meta( $p->ID, 'rank_math_canonical_url', true ),
			'focus'       => get_post_meta( $p->ID, 'rank_math_focus_keyword', true ),
			'schema'      => self::schema_meta( $p->ID ),
		);
	}

	private static function schema_meta( int $id ): array {
		$out = array();
		foreach ( get_post_meta( $id ) as $k => $vals ) {
			if ( 0 === strpos( $k, 'rank_math_schema_' ) ) {
				$out[ $k ] = maybe_unserialize( $vals[0] );
			}
		}
		return $out;
	}

	private static function rank_math_term_meta( int $id ): array {
		$out = array();
		foreach ( get_term_meta( $id ) as $k => $vals ) {
			if ( 0 === strpos( $k, 'rank_math_' ) ) {
				$out[ $k ] = maybe_unserialize( $vals[0] );
			}
		}
		return $out;
	}

	private static function redirects(): array {
		global $wpdb;
		$table = $wpdb->prefix . 'rank_math_redirections';
		if ( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) ) !== $table ) { // phpcs:ignore
			return array();
		}
		$rows = $wpdb->get_results( "SELECT sources, url_to, header_code, status FROM {$table}", ARRAY_A ); // phpcs:ignore
		foreach ( $rows as &$r ) {
			$r['sources'] = maybe_unserialize( $r['sources'] );
		}
		return $rows;
	}
}

CV_Export::init();
